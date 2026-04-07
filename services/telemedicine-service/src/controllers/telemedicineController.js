const TelemedicineSession = require("../models/TelemedicineSession");

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
      patientName,
      doctorName,
      appointmentDate,
      appointmentTime,
      roomName,
      meetingLink
    });

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
    await session.save();

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