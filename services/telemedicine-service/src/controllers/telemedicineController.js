const TelemedicineSession = require("../models/TelemedicineSession");
const {
  verifyAppointment,
  markAppointmentInProgress,
  markAppointmentCompleted
} = require("../services/appointmentService");

exports.createSession = async (req, res) => {
  try {
    const {
      appointmentId,
      patientId,
      doctorId,
      patientName,
      doctorName,
      appointmentDate,
      appointmentTime
    } = req.body;

    if (!appointmentId || !patientId || !doctorId) {
      return res.status(400).json({
        success: false,
        message: "appointmentId, patientId and doctorId are required"
      });
    }

    // Verify appointment exists and is valid for telemedicine
    const verification = await verifyAppointment(appointmentId, patientId, doctorId);
    if (!verification.valid) {
      return res.status(400).json({
        success: false,
        message: verification.message
      });
    }

    const existingSession = await TelemedicineSession.findOne({ appointmentId });

    if (existingSession) {
      return res.status(200).json({
        success: true,
        message: "Session already exists",
        data: existingSession
      });
    }

    const roomName = `smartmedicare-${appointmentId}`;
    const meetingLink = `https://meet.jit.si/${roomName}`;

    const session = await TelemedicineSession.create({
      appointmentId,
      patientId,
      doctorId,
      patientName: patientName || verification.appointment?.patientName,
      doctorName: doctorName || verification.appointment?.doctorName,
      appointmentDate: appointmentDate || verification.appointment?.appointmentDate,
      appointmentTime: appointmentTime || verification.appointment?.appointmentTime,
      roomName,
      meetingLink
    });

    // Update appointment with telemedicine session reference
    try {
      await markAppointmentInProgress(appointmentId);
    } catch (error) {
      console.error("[telemedicine-service] Failed to update appointment status:", error.message);
      // Non-blocking: session created successfully even if status update fails
    }

    return res.status(201).json({
      success: true,
      message: "Telemedicine session created successfully",
      data: session
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error creating telemedicine session",
      error: error.message
    });
  }
};

exports.getSessionByAppointmentId = async (req, res) => {
  try {
    const session = await TelemedicineSession.findOne({
      appointmentId: req.params.appointmentId
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Telemedicine session not found"
      });
    }

    // If session is active and being accessed, ensure appointment is marked in-progress
    if (session.status === "ACTIVE") {
      try {
        await markAppointmentInProgress(req.params.appointmentId);
      } catch (error) {
        console.error("[telemedicine-service] Failed to update appointment status:", error.message);
        // Non-blocking: return session even if status update fails
      }
    }

    return res.status(200).json({
      success: true,
      data: session
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching telemedicine session",
      error: error.message
    });
  }
};

exports.endSession = async (req, res) => {
  try {
    const session = await TelemedicineSession.findOne({
      appointmentId: req.params.appointmentId
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Telemedicine session not found"
      });
    }

    session.status = "ENDED";
    session.endedAt = new Date();
    await session.save();

    // Calculate session duration
    const duration = session.endedAt - session.createdAt;
    const durationMinutes = Math.round(duration / 1000 / 60);

    // Mark appointment as completed
    try {
      await markAppointmentCompleted(session.appointmentId, {
        notes: `Telemedicine consultation completed. Duration: ${durationMinutes} minutes`,
        duration: durationMinutes
      });
    } catch (error) {
      console.error("[telemedicine-service] Failed to mark appointment as completed:", error.message);
      // Non-blocking: session ended successfully even if appointment update fails
    }

    return res.status(200).json({
      success: true,
      message: "Telemedicine session ended successfully",
      data: session
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error ending telemedicine session",
      error: error.message
    });
  }
};