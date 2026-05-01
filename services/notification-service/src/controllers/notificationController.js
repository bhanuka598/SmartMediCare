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

const validatePaymentPayload = (body) => {
  if (!body) return "payload is required";
  if (!body.patient?.email && !body.patient?.phone) {
    return "patient contact info is required";
  }
  return null;
};

exports.sendPaymentReceived = async (req, res) => {
  const error = validatePaymentPayload(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error });
  }

  try {
    const deliveries = await notificationService.notifyPaymentReceived(req.body);
    return res.status(200).json({ success: true, deliveries });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to send payment notifications", error: err.message });
  }
};

exports.sendPaymentRefunded = async (req, res) => {
  const error = validatePaymentPayload(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error });
  }

  try {
    const deliveries = await notificationService.notifyPaymentRefunded(req.body);
    return res.status(200).json({ success: true, deliveries });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to send refund notifications", error: err.message });
  }
};

exports.sendRefundPayoutPaid = async (req, res) => {
  const error = validatePaymentPayload(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error });
  }

  try {
    const deliveries = await notificationService.notifyRefundPayoutPaid(req.body);
    return res.status(200).json({ success: true, deliveries });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to send refund payout notifications", error: err.message });
  }
};
