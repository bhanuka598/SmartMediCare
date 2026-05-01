const formatAppointmentDateTime = (appointmentDate, appointmentTime) => {
  if (!appointmentDate || !appointmentTime) {
    return "the scheduled time";
  }

  const date = new Date(`${appointmentDate}T${appointmentTime}`);
  if (Number.isNaN(date.getTime())) {
    return `${appointmentDate} ${appointmentTime}`;
  }

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
};

const buildAppointmentBookedNotifications = (payload) => {
  const when = formatAppointmentDateTime(payload.appointmentDate, payload.appointmentTime);
  const patientName = payload.patient?.name || "Patient";
  const doctorName = payload.doctor?.name || "Doctor";
  const typeLabel = (payload.type || "IN_PERSON").replace("_", " ").toLowerCase();

  return [
    {
      recipient: "patient",
      email: payload.patient?.email,
      phone: payload.patient?.phone,
      subject: "Appointment booking confirmed",
      text: `Hi ${patientName}, your appointment with ${doctorName} is booked for ${when}. Consultation type: ${typeLabel}.`,
      html: `<p>Hi ${patientName},</p><p>Your appointment with <strong>${doctorName}</strong> is booked for <strong>${when}</strong>.</p><p>Consultation type: ${typeLabel}.</p>`
    },
    {
      recipient: "doctor",
      email: payload.doctor?.email,
      phone: payload.doctor?.phone,
      subject: "New appointment booking received",
      text: `Hi ${doctorName}, ${patientName} booked an appointment for ${when}. Consultation type: ${typeLabel}.`,
      html: `<p>Hi ${doctorName},</p><p><strong>${patientName}</strong> booked an appointment for <strong>${when}</strong>.</p><p>Consultation type: ${typeLabel}.</p>`
    }
  ];
};

const buildConsultationCompletedNotifications = (payload) => {
  const when = formatAppointmentDateTime(payload.appointmentDate, payload.appointmentTime);
  const patientName = payload.patient?.name || "Patient";
  const doctorName = payload.doctor?.name || "Doctor";

  return [
    {
      recipient: "patient",
      email: payload.patient?.email,
      phone: payload.patient?.phone,
      subject: "Consultation completed",
      text: `Hi ${patientName}, your consultation with ${doctorName} scheduled for ${when} has been marked as completed.`,
      html: `<p>Hi ${patientName},</p><p>Your consultation with <strong>${doctorName}</strong> scheduled for <strong>${when}</strong> has been marked as completed.</p>`
    },
    {
      recipient: "doctor",
      email: payload.doctor?.email,
      phone: payload.doctor?.phone,
      subject: "Consultation completion confirmed",
      text: `Hi ${doctorName}, the consultation with ${patientName} scheduled for ${when} has been marked as completed.`,
      html: `<p>Hi ${doctorName},</p><p>The consultation with <strong>${patientName}</strong> scheduled for <strong>${when}</strong> has been marked as completed.</p>`
    }
  ];
};

const formatAmount = (amount, currency) => {
  const value = Number(amount) || 0;
  const cur = String(currency || "USD").toUpperCase();
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: cur
    }).format(value);
  } catch (_e) {
    return `${cur} ${value.toFixed(2)}`;
  }
};

const buildPaymentReceivedNotifications = (payload) => {
  const when = formatAppointmentDateTime(payload.appointmentDate, payload.appointmentTime);
  const patientName = payload.patient?.name || "Patient";
  const doctorName = payload.doctor?.name || "Doctor";
  const amount = formatAmount(payload.amount, payload.currency);
  const method = String(payload.paymentMethod || "card").replace("_", " ");

  return [
    {
      recipient: "patient",
      email: payload.patient?.email,
      phone: payload.patient?.phone,
      subject: "Payment received for your appointment",
      text: `Hi ${patientName}, we received your payment of ${amount} (${method}) for the appointment with ${doctorName} on ${when}.`,
      html: `<p>Hi ${patientName},</p><p>We received your payment of <strong>${amount}</strong> (${method}) for the appointment with <strong>${doctorName}</strong> on <strong>${when}</strong>.</p><p>Thank you for using SmartMediCare.</p>`
    },
    {
      recipient: "doctor",
      email: payload.doctor?.email,
      phone: payload.doctor?.phone,
      subject: "Payment received for upcoming appointment",
      text: `Hi ${doctorName}, payment of ${amount} (${method}) was received from ${patientName} for the appointment on ${when}.`,
      html: `<p>Hi ${doctorName},</p><p>Payment of <strong>${amount}</strong> (${method}) was received from <strong>${patientName}</strong> for the appointment on <strong>${when}</strong>.</p>`
    }
  ];
};

const buildPaymentRefundedNotifications = (payload) => {
  const when = formatAppointmentDateTime(payload.appointmentDate, payload.appointmentTime);
  const patientName = payload.patient?.name || "Patient";
  const doctorName = payload.doctor?.name || "Doctor";
  const amount = formatAmount(payload.amount, payload.currency);
  const reason = payload.reason ? ` Reason: ${payload.reason}.` : "";

  return [
    {
      recipient: "patient",
      email: payload.patient?.email,
      phone: payload.patient?.phone,
      subject: "Refund processed for your appointment",
      text: `Hi ${patientName}, a refund of ${amount} has been processed for your cancelled appointment with ${doctorName} on ${when}.${reason}`,
      html: `<p>Hi ${patientName},</p><p>A refund of <strong>${amount}</strong> has been processed for your cancelled appointment with <strong>${doctorName}</strong> on <strong>${when}</strong>.${reason}</p>`
    },
    {
      recipient: "doctor",
      email: payload.doctor?.email,
      phone: payload.doctor?.phone,
      subject: "Refund processed for cancelled appointment",
      text: `Hi ${doctorName}, a refund of ${amount} was issued to ${patientName} for the cancelled appointment on ${when}.`,
      html: `<p>Hi ${doctorName},</p><p>A refund of <strong>${amount}</strong> was issued to <strong>${patientName}</strong> for the cancelled appointment on <strong>${when}</strong>.</p>`
    }
  ];
};

const buildRefundPayoutPaidNotifications = (payload) => {
  const when = formatAppointmentDateTime(payload.appointmentDate, payload.appointmentTime);
  const patientName = payload.patient?.name || "Patient";
  const amount = formatAmount(payload.amount, payload.currency);

  return [
    {
      recipient: "patient",
      email: payload.patient?.email,
      phone: payload.patient?.phone,
      subject: "Your refund has been paid",
      text: `Hi ${patientName}, your refund of ${amount} for the appointment on ${when} has been paid via Stripe.`,
      html: `<p>Hi ${patientName},</p><p>Your refund of <strong>${amount}</strong> for the appointment on <strong>${when}</strong> has been paid via Stripe.</p><p>It should appear on your statement shortly.</p>`
    }
  ];
};

module.exports = {
  buildAppointmentBookedNotifications,
  buildConsultationCompletedNotifications,
  buildPaymentReceivedNotifications,
  buildPaymentRefundedNotifications,
  buildRefundPayoutPaidNotifications
};
