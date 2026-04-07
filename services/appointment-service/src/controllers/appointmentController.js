const appointmentService = require("../services/appointmentService");
const realtimeTrackingService = require("../services/realtimeTrackingService");

exports.searchDoctorsBySpecialty = async (req, res) => {
  try {
    const { specialty, available, date, minRating, maxFee } = req.query;

    const filters = { available, date, minRating, maxFee };
    const result = await appointmentService.searchDoctors(specialty, filters);

    return res.status(result.success ? 200 : 400).json(result);
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
    const userId = req.userId || req.user?.id || req.user?._id;
    const result = await appointmentService.createAppointment(req.body, userId);

    if (result.success && result.data) {
      realtimeTrackingService.broadcastToUser(result.data.patientId, "new-appointment", {
        appointmentId: result.data._id,
        message: "New appointment created"
      });
    }

    return res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error creating appointment",
      error: error.message
    });
  }
};

exports.getAllAppointments = async (req, res) => {
  try {
    const { status, limit, page, sortBy, dateFrom, dateTo, type, paymentStatus } = req.query;

    const query = { status, type, paymentStatus, dateFrom, dateTo };
    const options = {
      limit: limit || 50,
      skip: page ? (parseInt(page) - 1) * parseInt(limit || 50) : 0
    };

    const result = await appointmentService.getAppointments(query, options);

    return res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching appointments",
      error: error.message
    });
  }
};

exports.getAppointmentById = async (req, res) => {
  try {
    const result = await appointmentService.getAppointmentById(req.params.id);
    return res.status(result.success ? 200 : 404).json(result);
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
    const patientId = req.params.patientId || req.userId || req.user?.id;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "Patient ID is required"
      });
    }

    const { status, limit, sortBy, dateFrom, dateTo } = req.query;

    const query = { patientId, status, sortBy, dateFrom, dateTo };
    const options = { limit: limit || 50 };

    const result = await appointmentService.getAppointments(query, options);

    return res.status(result.success ? 200 : 500).json(result);
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

    const { status, limit, sortBy, dateFrom, dateTo } = req.query;

    const query = { doctorId, status, sortBy, dateFrom, dateTo };
    const options = { limit: limit || 50 };

    const result = await appointmentService.getAppointments(query, options);

    return res.status(result.success ? 200 : 500).json(result);
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
    const userId = req.userId || req.user?.id || req.user?._id;
    const result = await appointmentService.updateAppointment(req.params.id, req.body, userId);

    if (result.success && result.data) {
      await realtimeTrackingService.notifyStatusChange(
        result.data._id.toString(),
        result.data.status,
        result.data.status,
        userId
      );
    }

    return res.status(result.success ? 200 : 400).json(result);
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
    const userId = req.userId || req.user?.id || req.user?._id;
    const { reason } = req.body;
    const cancelledBy = req.userRole === "doctor" ? "DOCTOR" : "PATIENT";

    const result = await appointmentService.cancelAppointment(req.params.id, reason, cancelledBy, userId);

    if (result.success && result.data) {
      await realtimeTrackingService.notifyStatusChange(
        result.data._id.toString(),
        result.data.status,
        "CANCELLED",
        userId
      );
    }

    return res.status(result.success ? 200 : 400).json(result);
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
    const userId = req.userId || req.user?.id || req.user?._id;
    const result = await appointmentService.confirmAppointment(req.params.id, userId);

    if (result.success && result.data) {
      await realtimeTrackingService.notifyStatusChange(
        result.data._id.toString(),
        "PENDING",
        "CONFIRMED",
        userId
      );

      realtimeTrackingService.updateQueueStatus(
        result.data.doctorId,
        result.data.appointmentDate
      );
    }

    return res.status(result.success ? 200 : 400).json(result);
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
    const userId = req.userId || req.user?.id || req.user?._id;
    const { reason } = req.body;
    const result = await appointmentService.rejectAppointment(req.params.id, reason, userId);

    if (result.success && result.data) {
      await realtimeTrackingService.notifyStatusChange(
        result.data._id.toString(),
        "PENDING",
        "REJECTED",
        userId
      );
    }

    return res.status(result.success ? 200 : 400).json(result);
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
    const userId = req.userId || req.user?.id || req.user?._id;
    const { notes, prescription } = req.body;
    const result = await appointmentService.completeAppointment(req.params.id, notes, prescription, userId);

    if (result.success && result.data) {
      await realtimeTrackingService.notifyStatusChange(
        result.data._id.toString(),
        result.data.status,
        "COMPLETED",
        userId
      );
    }

    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error completing appointment",
      error: error.message
    });
  }
};

exports.markInProgress = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id || req.user?._id;
    const result = await appointmentService.markInProgress(req.params.id, userId);

    if (result.success && result.data) {
      await realtimeTrackingService.notifyStatusChange(
        result.data._id.toString(),
        "CONFIRMED",
        "IN_PROGRESS",
        userId
      );

      realtimeTrackingService.updateQueueStatus(
        result.data.doctorId,
        result.data.appointmentDate
      );
    }

    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error marking appointment as in progress",
      error: error.message
    });
  }
};

exports.markNoShow = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id || req.user?._id;
    const result = await appointmentService.markNoShow(req.params.id, userId);

    if (result.success && result.data) {
      await realtimeTrackingService.notifyStatusChange(
        result.data._id.toString(),
        result.data.status,
        "NO_SHOW",
        userId
      );
    }

    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error marking appointment as no-show",
      error: error.message
    });
  }
};

exports.getAppointmentStatus = async (req, res) => {
  try {
    const result = await appointmentService.getAppointmentStatus(req.params.id);
    return res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching appointment status",
      error: error.message
    });
  }
};

exports.rateAppointment = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id || req.user?._id;
    const { rating, feedback } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5"
      });
    }

    const result = await appointmentService.rateAppointment(req.params.id, rating, feedback, userId);

    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error submitting rating",
      error: error.message
    });
  }
};

exports.getDoctorSchedule = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    const result = await appointmentService.getDoctorSchedule(doctorId, date);
    return res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching doctor schedule",
      error: error.message
    });
  }
};

exports.getAvailableSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date is required"
      });
    }

    const result = await appointmentService.getAvailableSlots(doctorId, date);
    return res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching available slots",
      error: error.message
    });
  }
};

exports.getAppointmentStatistics = async (req, res) => {
  try {
    const { doctorId, patientId, dateFrom, dateTo } = req.query;

    const query = { doctorId, patientId, dateFrom, dateTo };
    const result = await appointmentService.getAppointmentStatistics(query);

    return res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching appointment statistics",
      error: error.message
    });
  }
};

exports.getAppointmentWithSession = async (req, res) => {
  try {
    const result = await appointmentService.getAppointmentById(req.params.id);

    if (!result.success) {
      return res.status(404).json(result);
    }

    const { getTelemedicineSession } = require("../services/telemedicineService");
    const sessionResponse = await getTelemedicineSession(req.params.id);

    const responseData = {
      ...result.data.toObject(),
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
