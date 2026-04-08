const Transaction = require("../models/Transaction");
const {
  isStripeConfigured,
  createCheckoutSession,
  constructWebhookEvent
} = require("../services/stripeService");
const {
  getAppointmentPaymentContext,
  updateAppointmentPaymentStatus
} = require("../services/appointmentService");

const getClientBaseUrl = () => process.env.CLIENT_URL || "http://localhost:5173";

exports.createCheckoutSession = async (req, res) => {
  try {
    if (!isStripeConfigured()) {
      return res.status(503).json({
        success: false,
        message: "Stripe is not configured for the payment service"
      });
    }

    const { appointmentId } = req.body;

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: "appointmentId is required"
      });
    }

    const appointment = await getAppointmentPaymentContext(appointmentId);

    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    if (req.userRole !== "admin" && appointment.patientId !== req.userId) {
      return res.status(403).json({ success: false, message: "You can only pay for your own appointments" });
    }

    if (appointment.paymentStatus === "PAID") {
      const existingTransaction = await Transaction.findOne({
        appointmentId,
        status: "completed"
      }).sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        message: "Appointment has already been paid",
        transaction: existingTransaction,
        alreadyPaid: true
      });
    }

    const transaction = await Transaction.create({
      appointmentId: appointment.appointmentId,
      patientId: appointment.patientId,
      patientName: appointment.patientName || "",
      patientEmail: appointment.patientEmail || "",
      doctorId: appointment.doctorId,
      doctorName: appointment.doctorName || "",
      amount: appointment.fee || 0,
      currency: appointment.currency || "USD",
      status: "pending",
      paymentMethod: "stripe",
      metadata: {
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        specialty: appointment.specialty || ""
      }
    });

    const successUrl = `${getClientBaseUrl()}/patient/appointments?payment=success&appointmentId=${appointmentId}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${getClientBaseUrl()}/patient/appointments?payment=cancelled&appointmentId=${appointmentId}`;

    const session = await createCheckoutSession({
      appointment: {
        appointmentId: appointment.appointmentId,
        patientId: appointment.patientId,
        patientEmail: appointment.patientEmail || "",
        doctorId: appointment.doctorId,
        doctorName: appointment.doctorName || "Doctor",
        amount: appointment.fee || 0,
        currency: appointment.currency || "USD",
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        specialty: appointment.specialty || ""
      },
      transactionId: transaction._id.toString(),
      successUrl,
      cancelUrl
    });

    transaction.stripeCheckoutSessionId = session.id;
    await transaction.save();

    await updateAppointmentPaymentStatus(appointmentId, {
      paymentStatus: "PENDING",
      paymentReference: session.id
    });

    return res.status(201).json({
      success: true,
      message: "Stripe checkout session created",
      checkoutUrl: session.url,
      sessionId: session.id,
      transaction
    });
  } catch (error) {
    console.error("Create checkout session error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create checkout session",
      error: error.message
    });
  }
};

exports.handleWebhook = async (req, res) => {
  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(503).send("Missing STRIPE_WEBHOOK_SECRET");
    }

    const signature = req.headers["stripe-signature"];
    const event = constructWebhookEvent(req.body, signature);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const appointmentId = session.metadata?.appointmentId;
      const transactionId = session.metadata?.transactionId;

      const transaction = await Transaction.findById(transactionId);
      if (transaction && transaction.status !== "completed") {
        transaction.status = "completed";
        transaction.stripeEventId = event.id;
        transaction.stripePaymentIntentId = session.payment_intent || "";
        transaction.paidAt = new Date();
        await transaction.save();

        await updateAppointmentPaymentStatus(appointmentId, {
          paymentStatus: "PAID",
          paymentReference: session.payment_intent || session.id,
          paidAt: transaction.paidAt
        });
      }
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object;
      await Transaction.findOneAndUpdate(
        { stripeCheckoutSessionId: session.id, status: "pending" },
        { status: "cancelled", stripeEventId: event.id }
      );
    }

    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object;
      await Transaction.findOneAndUpdate(
        { stripePaymentIntentId: paymentIntent.id },
        {
          status: "failed",
          failureReason: paymentIntent.last_payment_error?.message || "Stripe payment failed",
          stripeEventId: event.id
        }
      );
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const query = req.userRole === "admin" ? {} : { patientId: req.userId };
    const transactions = await Transaction.find(query).sort({ createdAt: -1 });

    return res.json({
      success: true,
      transactions
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
      error: error.message
    });
  }
};

exports.getTransactionById = async (req, res) => {
  try {
    const query = { _id: req.params.id };
    if (req.userRole !== "admin") {
      query.patientId = req.userId;
    }

    const transaction = await Transaction.findOne(query);
    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    return res.json({
      success: true,
      transaction
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch transaction",
      error: error.message
    });
  }
};

exports.getPaymentConfig = async (_req, res) => {
  return res.json({
    success: true,
    provider: "stripe",
    live: isStripeConfigured(),
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || ""
  });
};
