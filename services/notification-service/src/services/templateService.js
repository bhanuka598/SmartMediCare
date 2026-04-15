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

module.exports = {
  buildAppointmentBookedNotifications,
  buildConsultationCompletedNotifications
};
