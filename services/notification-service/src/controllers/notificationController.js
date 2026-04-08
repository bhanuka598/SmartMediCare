const notificationService = require("../services/notificationService");

const validatePayload = (body) => {
  if (!body?.appointmentId) return "appointmentId is required";
  if (!body?.patient?.name && !body?.doctor?.name) return "patient and doctor details are required";
  return null;
};

exports.sendAppointmentBooked = async (req, res) => {
  const error = validatePayload(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error });
  }

  try {
    const deliveries = await notificationService.notifyAppointmentBooked(req.body);
    return res.status(200).json({ success: true, deliveries });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to send booking notifications", error: err.message });
  }
};

exports.sendConsultationCompleted = async (req, res) => {
  const error = validatePayload(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error });
  }

  try {
    const deliveries = await notificationService.notifyConsultationCompleted(req.body);
    return res.status(200).json({ success: true, deliveries });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to send completion notifications", error: err.message });
  }
};
