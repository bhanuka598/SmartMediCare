const Appointment = require("../models/Appointment");
const {
  searchDoctorsBySpecialtyFromDoctorService
} = require("../services/doctorService");
const {
  createTelemedicineSession,
  getTelemedicineSession,
  endTelemedicineSession
} = require("../services/telemedicineService");

const isPastDateTime = (dateStr, timeStr) => {
  const appointmentDateTime = new Date(`${dateStr}T${timeStr}`);
  return appointmentDateTime < new Date();
};

exports.searchDoctorsBySpecialty = async (req, res) => {
  try {
    const { specialty } = req.query;

    if (!specialty) {
      return res.status(400).json({
        success: false,
        message: "Specialty is required"
      });
    }

    const doctors = await searchDoctorsBySpecialtyFromDoctorService(specialty);

    return res.status(200).json({
      success: true,
      message: "Doctors fetched successfully",
      data: doctors.data || []
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error searching doctors",
      error: error.message
    });
  }
};

exports.createAppointment = async (req, res) => {
  try {
    const {
      patientId,
      patientName,
      doctorId,
      doctorName,
      specialty,
      appointmentDate,
      appointmentTime,
      reason
    } = req.body;

    if (
      !patientId ||
      !doctorId ||
      !specialty ||
      !appointmentDate ||
      !appointmentTime
    ) {
      return res.status(400).json({
        success: false,
        message:
          "patientId, doctorId, specialty, appointmentDate and appointmentTime are required"
      });
    }

    if (isPastDateTime(appointmentDate, appointmentTime)) {
      return res.status(400).json({
        success: false,
        message: "Cannot book an appointment in the past"
      });
    }

    const existingSlot = await Appointment.findOne({
      doctorId,
      appointmentDate,
      appointmentTime
    });

    if (existingSlot) {
      return res.status(400).json({
        success: false,
        message: "This doctor already has an appointment at this time slot"
      });
    }

    const appointment = await Appointment.create({
      patientId,
      patientName,
      doctorId,
      doctorName,
      specialty,
      appointmentDate,
      appointmentTime,
      reason
    });

    return res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      data: appointment
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error creating appointment",
      error: error.message
    });
  }
};

exports.getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching appointment",
      error: error.message
    });
  }
};

exports.getPatientAppointments = async (req, res) => {
  try {
    const { patientId } = req.params;

    const appointments = await Appointment.find({ patientId }).sort({
      createdAt: -1
    });

    return res.status(200).json({
      success: true,
      data: appointments
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching patient appointments",
      error: error.message
    });
  }
};

exports.getDoctorAppointments = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const appointments = await Appointment.find({ doctorId }).sort({
      createdAt: -1
    });

    return res.status(200).json({
      success: true,
      data: appointments
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching doctor appointments",
      error: error.message
    });
  }
};

exports.updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { appointmentDate, appointmentTime, reason } = req.body;

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found"
      });
    }

    if (appointment.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Only pending appointments can be updated"
      });
    }

    const newDate = appointmentDate || appointment.appointmentDate;
    const newTime = appointmentTime || appointment.appointmentTime;

    if (isPastDateTime(newDate, newTime)) {
      return res.status(400).json({
        success: false,
        message: "Cannot set an appointment in the past"
      });
    }

    const conflictingSlot = await Appointment.findOne({
      _id: { $ne: id },
      doctorId: appointment.doctorId,
      appointmentDate: newDate,
      appointmentTime: newTime
    });

    if (conflictingSlot) {
      return res.status(400).json({
        success: false,
        message: "Selected time slot is already booked"
      });
    }

    appointment.appointmentDate = newDate;
    appointment.appointmentTime = newTime;
    if (reason !== undefined) appointment.reason = reason;

    await appointment.save();

    return res.status(200).json({
      success: true,
      message: "Appointment updated successfully",
      data: appointment
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error updating appointment",
      error: error.message
    });
  }
};

exports.cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found"
      });
    }

    if (appointment.status === "COMPLETED") {
      return res.status(400).json({
        success: false,
        message: "Completed appointment cannot be cancelled"
      });
    }

    appointment.status = "CANCELLED";
    await appointment.save();

    return res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully",
      data: appointment
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error cancelling appointment",
      error: error.message
    });
  }
};

exports.confirmAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found"
      });
    }

    if (appointment.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Only pending appointments can be confirmed"
      });
    }

    appointment.status = "CONFIRMED";

    const sessionResponse = await createTelemedicineSession(appointment);

    if (sessionResponse.success && sessionResponse.data?.meetingLink) {
      appointment.meetingLink = sessionResponse.data.meetingLink;
    }

    await appointment.save();

    return res.status(200).json({
      success: true,
      message: "Appointment confirmed successfully",
      data: appointment
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error confirming appointment",
      error: error.message
    });
  }
};

exports.rejectAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found"
      });
    }

    if (appointment.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Only pending appointments can be rejected"
      });
    }

    appointment.status = "REJECTED";
    await appointment.save();

    return res.status(200).json({
      success: true,
      message: "Appointment rejected successfully",
      data: appointment
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error rejecting appointment",
      error: error.message
    });
  }
};

exports.completeAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found"
      });
    }

    if (appointment.status !== "CONFIRMED") {
      return res.status(400).json({
        success: false,
        message: "Only confirmed appointments can be completed"
      });
    }

    appointment.status = "COMPLETED";
    await appointment.save();

    // End telemedicine session if exists
    await endTelemedicineSession(appointment._id.toString());

    return res.status(200).json({
      success: true,
      message: "Appointment marked as completed",
      data: appointment
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error completing appointment",
      error: error.message
    });
  }
};

/**
 * Get appointment with telemedicine session details
 * @route GET /api/appointments/:id/details
 */
exports.getAppointmentWithSession = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found"
      });
    }

    // Fetch telemedicine session details
    const sessionResponse = await getTelemedicineSession(
      appointment._id.toString()
    );

    const responseData = {
      ...appointment.toObject(),
      telemedicineSession:
        sessionResponse.success && sessionResponse.data
          ? sessionResponse.data
          : null
    };

    return res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching appointment details",
      error: error.message
    });
  }
};