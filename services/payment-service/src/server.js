require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Stripe = require("stripe");
const Transaction = require("./models/Transaction");

const app = express();
const PORT = process.env.PORT || 5006;
const APPOINTMENT_SERVICE_URL = process.env.APPOINTMENT_SERVICE_URL || "http://localhost:5001";
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || "http://localhost:5004";
const DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL || "http://localhost:5003";
const INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET || "secret";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

function generateServiceToken() {
  return jwt.sign({ service: "payment-service" }, INTERNAL_SERVICE_SECRET, { expiresIn: "1h" });
}

const ZERO_DECIMAL = new Set([
  "bif",
  "clp",
  "djf",
  "gnf",
  "jpy",
  "kmf",
  "krw",
  "mga",
  "pyg",
  "rwf",
  "ugx",
  "vnd",
  "vuv",
  "xaf",
  "xof",
  "xpf"
]);

function toStripeUnitAmount(currency, amountNum) {
  const c = String(currency || "usd").toLowerCase();
  const n = Number(amountNum);
  if (!Number.isFinite(n) || n < 0) return 0;
  if (ZERO_DECIMAL.has(c)) return Math.round(n);
  return Math.round(n * 100);
}

function fromStripeAmountTotal(currency, amountTotal) {
  if (amountTotal == null) return 0;
  const c = String(currency || "usd").toLowerCase();
  if (ZERO_DECIMAL.has(c)) return amountTotal;
  return amountTotal / 100;
}

function normId(v) {
  if (v == null) return "";
  return String(v).trim();
}

async function markAppointmentPaidHttp(appointmentId) {
  const r = await fetch(`${APPOINTMENT_SERVICE_URL}/api/appointments/internal/${appointmentId}/mark-paid`, {
    method: "PATCH",
    headers: {
      "X-Service-Token": generateServiceToken(),
      "X-Service-Name": "payment-service",
      "Content-Type": "application/json"
    }
  });
  const json = await r.json();
  return { ok: r.ok, status: r.status, data: json };
}

async function markAppointmentRefundedHttp(appointmentId) {
  const r = await fetch(`${APPOINTMENT_SERVICE_URL}/api/appointments/internal/${appointmentId}/mark-refunded`, {
    method: "PATCH",
    headers: {
      "X-Service-Token": generateServiceToken(),
      "X-Service-Name": "payment-service",
      "Content-Type": "application/json"
    }
  });
  const json = await r.json();
  return { ok: r.ok, status: r.status, data: json };
}

async function fetchDoctorContactInternal(doctorId) {
  if (!doctorId) return { name: "", email: "", phone: "" };
  try {
    const r = await fetch(`${DOCTOR_SERVICE_URL}/api/doctors/internal/${doctorId}`, {
      headers: {
        "X-Service-Token": generateServiceToken(),
        "X-Service-Name": "payment-service"
      }
    });
    const json = await r.json();
    if (!r.ok) return { name: "", email: "", phone: "" };
    const data = json?.data || json?.doctor || json || {};
    return {
      name: data.name || "",
      email: data.email || "",
      phone: data.phone || ""
    };
  } catch (_e) {
    return { name: "", email: "", phone: "" };
  }
}

async function postNotification(endpoint, payload) {
  try {
    const r = await fetch(`${NOTIFICATION_SERVICE_URL}/api/notifications/${endpoint}`, {
      method: "POST",
      headers: {
        "X-Service-Token": generateServiceToken(),
        "X-Service-Name": "payment-service",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    if (!r.ok) {
      const text = await r.text().catch(() => "");
      console.warn(`[payment-service] notification ${endpoint} failed (${r.status}):`, text);
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.warn(`[payment-service] notification ${endpoint} error:`, err.message);
    return { ok: false };
  }
}

async function buildPaymentNotificationPayload(appointment, transaction, extra = {}) {
  if (!appointment) return null;
  const doctorContact = await fetchDoctorContactInternal(appointment.doctorId);
  return {
    appointmentId: String(appointment._id || transaction?.appointmentId || ""),
    appointmentDate: appointment.appointmentDate,
    appointmentTime: appointment.appointmentTime,
    type: appointment.type,
    amount: transaction?.amount ?? appointment.fee ?? 0,
    currency: transaction?.currency || "USD",
    paymentMethod: transaction?.paymentMethod || "card",
    patient: {
      name: appointment.patientName || transaction?.patientName || "Patient",
      email: appointment.patientEmail || "",
      phone: appointment.patientPhone || ""
    },
    doctor: {
      name: appointment.doctorName || transaction?.doctorName || doctorContact.name || "Doctor",
      email: doctorContact.email,
      phone: doctorContact.phone
    },
    ...extra
  };
}

/** Shared by POST /complete-checkout and Stripe webhook */
async function finalizeStripePaidSession(session, patientIdOverride) {
  const metaAppt = session.metadata?.appointmentId || session.client_reference_id;
  if (!metaAppt) {
    return { ok: false, message: "Missing appointment id on Stripe session", detail: null };
  }

  const mark = await markAppointmentPaidHttp(metaAppt);
  if (!mark.ok) {
    return { ok: false, message: "Could not update appointment after payment", detail: mark.data };
  }

  const paidAmount = fromStripeAmountTotal(session.currency, session.amount_total);
  const cur = (session.currency || "usd").toUpperCase();
  const pid =
    patientIdOverride != null && patientIdOverride !== ""
      ? normId(patientIdOverride)
      : normId(session.metadata?.patientId);

  const transaction = await Transaction.findOneAndUpdate(
    { appointmentId: metaAppt },
    {
      patientId: pid || "unknown",
      patientName: session.customer_details?.name || session.customer_email || "",
      doctorId: session.metadata?.doctorId || "",
      doctorName: session.metadata?.doctorName || "",
      appointmentId: metaAppt,
      amount: paidAmount,
      currency: cur,
      paymentMethod: "stripe_checkout",
      stripeSessionId: session.id || "",
      stripePaymentIntentId:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id || "",
      status: "completed"
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  try {
    const appointment = mark.data?.data || mark.data?.appointment || null;
    const payload = await buildPaymentNotificationPayload(appointment, transaction);
    if (payload) {
      await postNotification("payment-received", payload);
    }
  } catch (err) {
    console.warn("[payment-service] payment-received email failed:", err.message);
  }

  return { ok: true, appointmentId: metaAppt };
}

app.use(cors());

/**
 * Stripe webhooks need the raw body (must be registered before express.json()).
 * Local: stripe listen --forward-to localhost:5006/api/payments/webhook
 */
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const stripe = getStripe();
    const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripe || !whSecret) {
      return res.status(503).json({ message: "Webhook not configured (STRIPE_WEBHOOK_SECRET)" });
    }
    const sig = req.headers["stripe-signature"];
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, whSecret);
    } catch (err) {
      console.error("Stripe webhook signature:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      if (session.payment_status === "paid") {
        const result = await finalizeStripePaidSession(session);
        if (!result.ok) {
          console.error("Webhook finalizeStripePaidSession:", result.message, result.detail);
        }
      }
    }

    return res.json({ received: true });
  }
);

app.use(express.json());

function protect(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized" });
  }
  try {
    const decoded = jwt.verify(auth.slice(7), process.env.JWT_SECRET || "secret");
    req.user = decoded;
    req.userId = decoded.id || decoded.userId;
    next();
  } catch (e) {
    return res.status(401).json({ message: "Not authorized" });
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

function patientOnly(req, res, next) {
  const role = req.user?.role;
  if (role !== "patient" && role !== "admin") {
    return res.status(403).json({ message: "Patient access required" });
  }
  next();
}

async function resolveStripePaymentIntentId(stripe, transaction) {
  if (transaction.stripePaymentIntentId) {
    return transaction.stripePaymentIntentId;
  }

  if (transaction.stripeSessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(transaction.stripeSessionId, {
        expand: ["payment_intent"]
      });
      if (typeof session.payment_intent === "string") {
        return session.payment_intent;
      }
      if (session.payment_intent?.id) {
        return session.payment_intent.id;
      }
    } catch (err) {
      console.warn("resolveStripePaymentIntentId: session retrieve failed:", err.message);
    }
  }

  return "";
}

async function applyRefundToTransaction(transaction, actorId, reason = "", requester = {}) {
  let stripeRefundId = "";
  let ledgerOnly = false;
  let stripeWarning = null;

  if (transaction.paymentMethod === "stripe_checkout") {
    const stripe = getStripe();
    if (!stripe) {
      ledgerOnly = true;
      stripeWarning = "Stripe is not configured; refund recorded in ledger only";
    } else {
      const paymentIntentId = await resolveStripePaymentIntentId(stripe, transaction);
      if (!paymentIntentId) {
        ledgerOnly = true;
        stripeWarning = "No Stripe payment reference on this transaction; refund recorded in ledger only";
      } else {
        try {
          const refund = await stripe.refunds.create({
            payment_intent: paymentIntentId,
            reason: "requested_by_customer",
            metadata: {
              transactionId: String(transaction._id),
              appointmentId: String(transaction.appointmentId || ""),
              actorId: String(actorId || ""),
              reason: String(reason || "").trim()
            }
          });
          stripeRefundId = refund.id;
          transaction.stripePaymentIntentId = paymentIntentId;
        } catch (err) {
          console.warn("applyRefundToTransaction: Stripe refund failed:", err.message);
          ledgerOnly = true;
          stripeWarning = `Stripe refund failed: ${err.message}; refund recorded in ledger only`;
        }
      }
    }
  }

  transaction.status = "refunded";
  transaction.refundReason = String(reason || "").trim();
  transaction.refundedBy = String(actorId || "");
  transaction.refundedAt = new Date();
  if (requester && typeof requester === "object") {
    if (requester.name != null) {
      transaction.refundRequesterName = String(requester.name || "").trim();
    }
    if (requester.email != null) {
      transaction.refundRequesterEmail = String(requester.email || "").trim();
    }
    if (requester.phone != null) {
      transaction.refundRequesterPhone = String(requester.phone || "").trim();
    }
  }
  if (stripeRefundId) {
    transaction.refundId = stripeRefundId;
  } else if (ledgerOnly && !transaction.refundId) {
    transaction.refundId = "ledger-only";
  }
  await transaction.save();

  let appointmentSyncWarning = null;
  let refundedAppointment = null;
  if (transaction.appointmentId) {
    const mark = await markAppointmentRefundedHttp(transaction.appointmentId);
    if (!mark.ok) {
      appointmentSyncWarning = mark.data?.message || "Could not update appointment payment status";
    } else {
      refundedAppointment = mark.data?.data || mark.data?.appointment || null;
    }
  }

  try {
    if (refundedAppointment) {
      const payload = await buildPaymentNotificationPayload(refundedAppointment, transaction, {
        reason: transaction.refundReason || ""
      });
      if (payload) {
        await postNotification("payment-refunded", payload);
      }
    }
  } catch (err) {
    console.warn("[payment-service] payment-refunded email failed:", err.message);
  }

  return {
    ok: true,
    transaction,
    stripeRefundId: stripeRefundId || null,
    ledgerOnly,
    stripeWarning,
    appointmentSyncWarning
  };
}

async function fetchAppointmentAsPatient(authorization, appointmentId) {
  const r = await fetch(`${APPOINTMENT_SERVICE_URL}/api/appointments/${appointmentId}`, {
    headers: { Authorization: authorization }
  });
  const json = await r.json();
  if (!r.ok || !json.success || !json.data) {
    return { ok: false, status: r.status, message: json.message || "Appointment not found" };
  }
  return { ok: true, data: json.data };
}

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "payment-service" });
});

/**
 * Returns whether Stripe Checkout can be used (secret key present).
 */
app.get("/api/payments/stripe-status", (req, res) => {
  res.json({
    configured: Boolean(process.env.STRIPE_SECRET_KEY),
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null
  });
});

app.get("/api/payments/transactions", protect, adminOnly, async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ createdAt: -1 }).lean();
    return res.json({ transactions });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});

/**
 * Patient lookup of their own transactions (used to render refund payout status).
 */
app.get("/api/payments/me/transactions", protect, patientOnly, async (req, res) => {
  try {
    const patientId = normId(req.userId ?? req.user?.id ?? req.user?._id);
    if (!patientId) {
      return res.status(400).json({ message: "Missing user id" });
    }
    const transactions = await Transaction.find({ patientId })
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ transactions });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});

/**
 * Admin refunds a transaction. For Stripe payments, creates a Stripe refund first.
 */
app.post("/api/payments/transactions/:transactionId/refund", protect, adminOnly, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const reason = String(req.body?.reason || "").trim();
    const adminUserId = String(req.user?.id || req.user?.userId || "");

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    if (transaction.status === "refunded") {
      return res.status(409).json({ message: "Transaction is already refunded" });
    }

    const result = await applyRefundToTransaction(transaction, adminUserId, reason);
    if (!result.ok) {
      return res.status(result.status || 500).json({ message: result.message || "Refund failed" });
    }

    return res.json({
      success: true,
      transaction: result.transaction,
      stripeRefundId: result.stripeRefundId,
      ledgerOnly: result.ledgerOnly,
      stripeWarning: result.stripeWarning,
      appointmentSyncWarning: result.appointmentSyncWarning
    });
  } catch (e) {
    console.error("admin refund failed:", e);
    return res.status(500).json({ message: e.message || "Refund failed" });
  }
});

/**
 * Patient applies for refund on a cancelled and paid appointment.
 */
app.post("/api/payments/appointments/:appointmentId/refund", protect, patientOnly, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const reason = String(req.body?.reason || "").trim();
    const requester = {
      name: String(req.body?.requesterName || req.body?.name || "").trim(),
      email: String(req.body?.requesterEmail || req.body?.email || "").trim(),
      phone: String(req.body?.requesterPhone || req.body?.phone || "").trim()
    };
    if (!reason) {
      return res.status(400).json({ message: "Refund reason is required" });
    }
    if (!requester.name) {
      return res.status(400).json({ message: "Your name is required" });
    }
    if (!requester.email) {
      return res.status(400).json({ message: "Your email is required" });
    }
    const actorId = normId(req.userId ?? req.user?.id ?? req.user?._id);
    const authHeader = req.headers.authorization;

    const apptRes = await fetchAppointmentAsPatient(authHeader, appointmentId);
    if (!apptRes.ok) {
      return res.status(apptRes.status || 404).json({ message: apptRes.message });
    }

    const appt = apptRes.data;
    const isAdmin = req.user?.role === "admin";
    if (!isAdmin && normId(appt.patientId) !== actorId) {
      return res.status(403).json({ message: "Appointment does not belong to you" });
    }
    if (String(appt.status || "").toUpperCase() !== "CANCELLED") {
      return res.status(400).json({ message: "Only cancelled appointments can be refunded" });
    }
    if (String(appt.paymentStatus || "").toUpperCase() !== "PAID") {
      return res.status(400).json({ message: "This appointment is not eligible for refund" });
    }

    const transaction = await Transaction.findOne({ appointmentId: String(appointmentId) });
    if (!transaction) {
      return res.status(404).json({ message: "Payment transaction not found for this appointment" });
    }
    if (!isAdmin && transaction.patientId && normId(transaction.patientId) !== actorId) {
      return res.status(403).json({ message: "Transaction does not belong to this account" });
    }
    if (transaction.status === "refunded") {
      return res.status(409).json({ message: "Transaction is already refunded" });
    }

    const result = await applyRefundToTransaction(transaction, actorId, reason, requester);
    if (!result.ok) {
      return res.status(result.status || 500).json({ message: result.message || "Refund failed" });
    }

    return res.json({
      success: true,
      transaction: result.transaction,
      stripeRefundId: result.stripeRefundId,
      ledgerOnly: result.ledgerOnly,
      stripeWarning: result.stripeWarning,
      appointmentSyncWarning: result.appointmentSyncWarning
    });
  } catch (e) {
    console.error("patient refund apply failed:", e);
    return res.status(500).json({ message: e.message || "Refund failed" });
  }
});

/**
 * Admin starts Stripe Checkout to pay out a refund for a refunded transaction.
 */
app.post("/api/payments/transactions/:transactionId/refund-payout/checkout", protect, adminOnly, async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return res.status(503).json({ message: "Stripe is not configured. Set STRIPE_SECRET_KEY on the payment service." });
    }

    const { transactionId } = req.params;
    const { successUrl, cancelUrl, currency: currencyFromClient } = req.body;
    if (!successUrl || !cancelUrl) {
      return res.status(400).json({ message: "successUrl and cancelUrl are required" });
    }

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    if (transaction.status !== "refunded") {
      return res.status(400).json({ message: "Transaction is not refunded" });
    }
    if (transaction.refundPayoutStatus === "paid") {
      return res.status(409).json({ message: "Refund payout is already paid" });
    }
    if (transaction.refundPayoutStatus === "rejected") {
      return res.status(400).json({ message: "This refund payout was rejected" });
    }
    const amount = Number(transaction.amount) || 0;
    if (amount <= 0) {
      return res.status(400).json({ message: "Nothing to pay for this refund" });
    }

    const currencyCode = String(currencyFromClient || transaction.currency || "USD")
      .trim()
      .toLowerCase();
    const unitAmount = toStripeUnitAmount(currencyCode, amount);
    if (unitAmount < 1) {
      return res.status(400).json({ message: "Amount is too small for Stripe" });
    }

    const successWithSession = successUrl.includes("{CHECKOUT_SESSION_ID}")
      ? successUrl
      : `${successUrl}${successUrl.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: currencyCode,
            product_data: {
              name: `Refund payout — ${transaction.patientName || "Patient"}`,
              description: `Refund for appointment ${transaction.appointmentId || transaction._id}`
            },
            unit_amount: unitAmount
          },
          quantity: 1
        }
      ],
      success_url: successWithSession,
      cancel_url: cancelUrl,
      metadata: {
        type: "refund_payout",
        transactionId: String(transaction._id),
        appointmentId: String(transaction.appointmentId || ""),
        patientId: String(transaction.patientId || "")
      },
      client_reference_id: String(transaction._id).slice(0, 255)
    });

    transaction.refundPayoutStatus = "pending";
    transaction.refundPayoutSessionId = session.id;
    await transaction.save();

    return res.json({
      success: true,
      url: session.url,
      sessionId: session.id
    });
  } catch (e) {
    console.error("refund-payout checkout failed:", e);
    return res.status(500).json({ message: e.message || "Refund payout checkout failed" });
  }
});

/**
 * Admin completes the refund payout after returning from Stripe Checkout.
 */
app.post("/api/payments/transactions/:transactionId/refund-payout/complete", protect, adminOnly, async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return res.status(503).json({ message: "Stripe is not configured" });
    }

    const { transactionId } = req.params;
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ message: "sessionId is required" });
    }

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    if (transaction.refundPayoutStatus === "paid") {
      return res.json({ success: true, alreadyPaid: true, transaction });
    }
    if (transaction.refundPayoutStatus === "rejected") {
      return res.status(400).json({ message: "This refund payout was rejected" });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.metadata?.transactionId && session.metadata.transactionId !== String(transaction._id)) {
      return res.status(400).json({ message: "Session does not match this transaction" });
    }
    if (session.payment_status !== "paid") {
      transaction.refundPayoutStatus = "failed";
      await transaction.save();
      return res.status(400).json({ message: "Refund payout not completed" });
    }

    transaction.refundPayoutStatus = "paid";
    transaction.refundPayoutPaidAt = new Date();
    transaction.refundPayoutSessionId = session.id;
    await transaction.save();

    try {
      let appointment = null;
      if (transaction.appointmentId) {
        const r = await fetch(
          `${APPOINTMENT_SERVICE_URL}/api/appointments/internal/${transaction.appointmentId}`,
          {
            headers: {
              "X-Service-Token": generateServiceToken(),
              "X-Service-Name": "payment-service"
            }
          }
        );
        if (r.ok) {
          const j = await r.json();
          appointment = j?.data || j?.appointment || null;
        }
      }
      const payload = await buildPaymentNotificationPayload(appointment, transaction);
      if (payload) {
        await postNotification("refund-payout-paid", payload);
      }
    } catch (err) {
      console.warn("[payment-service] refund-payout-paid email failed:", err.message);
    }

    return res.json({
      success: true,
      transaction
    });
  } catch (e) {
    console.error("refund-payout complete failed:", e);
    return res.status(500).json({ message: e.message || "Refund payout completion failed" });
  }
});

/**
 * Admin rejects paying out a refund (records reason for the patient).
 */
app.post("/api/payments/transactions/:transactionId/refund-payout/reject", protect, adminOnly, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const reason = String(req.body?.reason || "").trim();
    if (!reason) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    if (transaction.status !== "refunded") {
      return res.status(400).json({ message: "Transaction is not refunded" });
    }
    if (transaction.refundPayoutStatus === "paid") {
      return res.status(409).json({ message: "Refund payout is already paid" });
    }
    if (transaction.refundPayoutStatus === "rejected") {
      return res.status(409).json({ message: "Refund payout is already rejected" });
    }

    transaction.refundPayoutStatus = "rejected";
    transaction.refundPayoutRejectReason = reason;
    transaction.refundPayoutRejectedAt = new Date();
    transaction.refundPayoutSessionId = "";
    await transaction.save();

    return res.json({
      success: true,
      transaction
    });
  } catch (e) {
    console.error("refund-payout reject failed:", e);
    return res.status(500).json({ message: e.message || "Refund payout rejection failed" });
  }
});

/**
 * Create a Stripe Checkout Session (hosted payment page with card fields).
 */
app.post("/api/payments/create-checkout-session", protect, patientOnly, async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return res.status(503).json({
        success: false,
        message: "Stripe is not configured. Set STRIPE_SECRET_KEY on the payment service."
      });
    }

    const { appointmentId, successUrl, cancelUrl, currency: currencyFromClient } = req.body;
    if (!appointmentId || !successUrl || !cancelUrl) {
      return res.status(400).json({
        message: "appointmentId, successUrl, and cancelUrl are required"
      });
    }

    const authHeader = req.headers.authorization;
    const apptRes = await fetchAppointmentAsPatient(authHeader, appointmentId);
    if (!apptRes.ok) {
      return res.status(apptRes.status || 404).json({ message: apptRes.message });
    }

    const appt = apptRes.data;
    const tokenUserId = normId(req.userId ?? req.user?.id ?? req.user?._id);
    if (normId(appt.patientId) !== tokenUserId) {
      return res.status(403).json({ message: "This appointment does not belong to you" });
    }
    if (appt.paymentStatus !== "PENDING") {
      return res.status(400).json({
        message: "Appointment does not require payment or is already paid"
      });
    }

    const fee = Number(appt.fee) || 0;
    if (fee <= 0) {
      return res.status(400).json({ message: "Nothing to pay for this appointment" });
    }

    const currencyCode = String(currencyFromClient || "USD")
      .trim()
      .toLowerCase();
    const unitAmount = toStripeUnitAmount(currencyCode, fee);
    if (unitAmount < 1) {
      return res.status(400).json({ message: "Amount is too small for Stripe" });
    }

    const successWithSession = successUrl.includes("{CHECKOUT_SESSION_ID}")
      ? successUrl
      : `${successUrl}${successUrl.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: currencyCode,
            product_data: {
              name: `Consultation — ${appt.doctorName || "Doctor"}`,
              description: `${appt.appointmentDate} ${appt.appointmentTime}`
            },
            unit_amount: unitAmount
          },
          quantity: 1
        }
      ],
      success_url: successWithSession,
      cancel_url: cancelUrl,
      metadata: {
        appointmentId: String(appointmentId),
        patientId: tokenUserId,
        doctorId: String(appt.doctorId || ""),
        doctorName: appt.doctorName || ""
      },
      client_reference_id: String(appointmentId).slice(0, 255),
      customer_email: appt.patientEmail || undefined
    });

    return res.json({
      success: true,
      url: session.url,
      sessionId: session.id
    });
  } catch (e) {
    console.error("create-checkout-session:", e);
    return res.status(500).json({ message: e.message || "Stripe error" });
  }
});

/**
 * After returning from Stripe Checkout, finalize appointment + transaction.
 */
app.post("/api/payments/complete-checkout", protect, patientOnly, async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return res.status(503).json({ message: "Stripe is not configured" });
    }

    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ message: "sessionId is required" });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      return res.status(400).json({ message: "Payment not completed" });
    }

    const metaAppt =
      session.metadata?.appointmentId ||
      session.client_reference_id ||
      null;
    if (!metaAppt) {
      return res.status(400).json({ message: "Invalid session metadata" });
    }

    const authHeader = req.headers.authorization;
    const apptRes = await fetchAppointmentAsPatient(authHeader, metaAppt);
    if (!apptRes.ok) {
      return res.status(apptRes.status || 404).json({ message: apptRes.message || "Appointment not found" });
    }

    const appt = apptRes.data;
    const tokenUserId = normId(req.userId ?? req.user?.id ?? req.user?._id);
    if (normId(appt.patientId) !== tokenUserId) {
      return res.status(403).json({ message: "Session does not belong to this account" });
    }

    if (appt.paymentStatus === "PAID") {
      return res.json({ success: true, appointmentId: metaAppt, alreadyPaid: true });
    }

    const result = await finalizeStripePaidSession(session, tokenUserId);
    if (!result.ok) {
      return res.status(502).json({
        message: result.message || "Could not finalize payment",
        details: result.detail
      });
    }

    return res.json({ success: true, appointmentId: metaAppt });
  } catch (e) {
    console.error("complete-checkout:", e);
    return res.status(500).json({ message: e.message || "Checkout completion failed" });
  }
});

/**
 * Patient (or admin) records a completed payment for an appointment (non-Stripe / legacy).
 */
app.post("/api/payments/transactions", protect, async (req, res) => {
  try {
    const role = req.user?.role;
    const tokenUserId = req.user?.id != null ? String(req.user.id) : "";
    const {
      appointmentId,
      amount,
      doctorId,
      doctorName,
      patientName,
      paymentMethod,
      currency,
      status
    } = req.body;

    if (!appointmentId) {
      return res.status(400).json({ message: "appointmentId is required" });
    }
    if (amount === undefined || amount === null || Number.isNaN(Number(amount))) {
      return res.status(400).json({ message: "amount is required" });
    }

    let patientId = tokenUserId;
    if (role === "patient") {
      if (req.body.patientId && String(req.body.patientId) !== tokenUserId) {
        return res.status(403).json({ message: "Cannot record payment for another patient" });
      }
    } else if (role === "admin" && req.body.patientId) {
      patientId = String(req.body.patientId);
    }

    const doc = await Transaction.findOneAndUpdate(
      { appointmentId },
      {
        patientId,
        patientName: patientName || "",
        doctorId: doctorId || "",
        doctorName: doctorName || "",
        appointmentId,
        amount: Number(amount),
        currency: currency || "USD",
        paymentMethod: paymentMethod || "card",
        status: status === "pending" || status === "failed" ? status : "completed"
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({ success: true, transaction: doc });
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({ message: "Transaction already exists for this appointment" });
    }
    return res.status(500).json({ message: e.message });
  }
});

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/payment-service_db";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Payment service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Payment service MongoDB connection failed:", err.message);
    process.exit(1);
  });
