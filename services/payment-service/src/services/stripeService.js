const Stripe = require("stripe");

let stripeClient = null;

const getStripeClient = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    return null;
  }

  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  return stripeClient;
};

const isStripeConfigured = () => Boolean(process.env.STRIPE_SECRET_KEY);

const createCheckoutSession = async ({
  appointment,
  transactionId,
  successUrl,
  cancelUrl
}) => {
  const stripe = getStripeClient();

  if (!stripe) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY before creating checkout sessions.");
  }

  return stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: appointment.patientEmail || undefined,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      appointmentId: appointment.appointmentId,
      transactionId,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: appointment.currency.toLowerCase(),
          unit_amount: Math.round(Number(appointment.amount || 0) * 100),
          product_data: {
            name: `Consultation with ${appointment.doctorName || "Doctor"}`,
            description: `${appointment.specialty || "Medical"} consultation on ${appointment.appointmentDate} at ${appointment.appointmentTime}`
          }
        }
      }
    ]
  });
};

const constructWebhookEvent = (payload, signature) => {
  const stripe = getStripeClient();
  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
};

module.exports = {
  getStripeClient,
  isStripeConfigured,
  createCheckoutSession,
  constructWebhookEvent
};
