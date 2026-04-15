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

  await Transaction.findOneAndUpdate(
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
      status: "completed"
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

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
