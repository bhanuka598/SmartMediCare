const appointmentService = require('../services/appointmentService');
const telemedicineService = require('../services/telemedicineService');

/**
 * Get all appointments for the authenticated doctor
 */
exports.getMyAppointments = async (req, res) => {
  try {
    const { userId } = req;
    const { status, dateFrom, dateTo, limit, sortBy } = req.query;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Authentication token required' });
    }

    const filters = {
      status,
      dateFrom,
      dateTo,
      limit: limit || 100,
      sortBy: sortBy || 'dateDesc'
    };

    const result = await appointmentService.getDoctorAppointments(userId, token, filters);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Get my appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments',
      error: error.message
    });
  }
};

/**
 * Get pending appointment requests for the doctor
 */
exports.getPendingRequests = async (req, res) => {
  try {
    const { userId } = req;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Authentication token required' });
    }

    const result = await appointmentService.getDoctorAppointments(userId, token, {
      status: 'PENDING',
      limit: 50,
      sortBy: 'dateAsc'
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      requests: result.data || [],
      count: result.count || 0
    });
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending requests',
      error: error.message
    });
  }
};

/**
 * Accept/Confirm an appointment
 */
exports.acceptAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { userId } = req;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Authentication token required' });
    }

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: 'Appointment ID is required'
      });
    }

    // Verify the appointment belongs to this doctor
    const appointment = await appointmentService.getAppointmentById(appointmentId, token);
    if (!appointment.success) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (appointment.data?.doctorId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to manage this appointment'
      });
    }

    const result = await appointmentService.confirmAppointment(appointmentId, token);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: 'Appointment accepted successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Accept appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept appointment',
      error: error.message
    });
  }
};

/**
 * Reject an appointment
 */
exports.rejectAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { reason } = req.body;
    const { userId } = req;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Authentication token required' });
    }

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: 'Appointment ID is required'
      });
    }

    // Verify the appointment belongs to this doctor
    const appointment = await appointmentService.getAppointmentById(appointmentId, token);
    if (!appointment.success) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (appointment.data?.doctorId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to manage this appointment'
      });
    }

    const result = await appointmentService.rejectAppointment(appointmentId, token, reason);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: 'Appointment rejected successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Reject appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject appointment',
      error: error.message
    });
  }
};

/**
 * Complete an appointment
 */
exports.completeAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { notes, prescription } = req.body;
    const { userId } = req;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Authentication token required' });
    }

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: 'Appointment ID is required'
      });
    }

    // Verify the appointment belongs to this doctor
    const appointment = await appointmentService.getAppointmentById(appointmentId, token);
    if (!appointment.success) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (appointment.data?.doctorId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to manage this appointment'
      });
    }

    const result = await appointmentService.completeAppointment(appointmentId, token, {
      notes,
      prescription
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: 'Appointment completed successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Complete appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete appointment',
      error: error.message
    });
  }
};

/**
 * Mark appointment as in-progress
 */
exports.markInProgress = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { userId } = req;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Authentication token required' });
    }

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: 'Appointment ID is required'
      });
    }

    // Verify the appointment belongs to this doctor
    const appointment = await appointmentService.getAppointmentById(appointmentId, token);
    if (!appointment.success) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (appointment.data?.doctorId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to manage this appointment'
      });
    }

    const result = await appointmentService.markInProgress(appointmentId, token);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: 'Appointment marked as in-progress',
      data: result.data
    });
  } catch (error) {
    console.error('Mark in-progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark appointment as in-progress',
      error: error.message
    });
  }
};

/**
 * Mark appointment as no-show
 */
exports.markNoShow = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { userId } = req;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Authentication token required' });
    }

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: 'Appointment ID is required'
      });
    }

    // Verify the appointment belongs to this doctor
    const appointment = await appointmentService.getAppointmentById(appointmentId, token);
    if (!appointment.success) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (appointment.data?.doctorId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to manage this appointment'
      });
    }

    const result = await appointmentService.markNoShow(appointmentId, token);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: 'Appointment marked as no-show',
      data: result.data
    });
  } catch (error) {
    console.error('Mark no-show error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark appointment as no-show',
      error: error.message
    });
  }
};

/**
 * Get today's appointments
 */
exports.getTodayAppointments = async (req, res) => {
  try {
    const { userId } = req;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Authentication token required' });
    }

    const today = new Date().toISOString().split('T')[0];

    const result = await appointmentService.getDoctorAppointments(userId, token, {
      dateFrom: today,
      dateTo: today,
      limit: 50,
      sortBy: 'dateAsc'
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      appointments: result.data || [],
      count: result.count || 0,
      date: today
    });
  } catch (error) {
    console.error('Get today appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch today\'s appointments',
      error: error.message
    });
  }
};

/**
 * Get appointment statistics for the doctor
 */
exports.getAppointmentStats = async (req, res) => {
  try {
    const { userId } = req;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Authentication token required' });
    }

    // Get all appointments
    const result = await appointmentService.getDoctorAppointments(userId, token, {
      limit: 1000
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    const appointments = result.data || [];

    // Calculate statistics
    const stats = {
      total: appointments.length,
      pending: appointments.filter(a => a.status === 'PENDING').length,
      confirmed: appointments.filter(a => a.status === 'CONFIRMED').length,
      completed: appointments.filter(a => a.status === 'COMPLETED').length,
      cancelled: appointments.filter(a => a.status === 'CANCELLED').length,
      rejected: appointments.filter(a => a.status === 'REJECTED').length,
      inProgress: appointments.filter(a => a.status === 'IN_PROGRESS').length,
      noShow: appointments.filter(a => a.status === 'NO_SHOW').length,
      today: appointments.filter(a => {
        const today = new Date().toISOString().split('T')[0];
        return a.appointmentDate === today;
      }).length,
      upcoming: appointments.filter(a => {
        const today = new Date().toISOString().split('T')[0];
        return a.appointmentDate >= today && ['CONFIRMED', 'PENDING'].includes(a.status);
      }).length
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get appointment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointment statistics',
      error: error.message
    });
  }
};

exports.getTelemedicineSession = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { userId } = req;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Authentication token required' });
    }

    const appointment = await appointmentService.getAppointmentById(appointmentId, token);
    if (!appointment.success) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appointment.data?.doctorId !== userId) {
      return res.status(403).json({ success: false, message: 'You are not authorized to access this session' });
    }

    const session = await telemedicineService.getSessionByAppointmentId(appointmentId, token);
    return res.json(session);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch telemedicine session',
      error: error.message
    });
  }
};

exports.startTelemedicineSession = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { userId } = req;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Authentication token required' });
    }

    const appointment = await appointmentService.getAppointmentById(appointmentId, token);
    if (!appointment.success) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appointment.data?.doctorId !== userId) {
      return res.status(403).json({ success: false, message: 'You are not authorized to start this session' });
    }

    if (appointment.data?.type !== 'TELEMEDICINE') {
      return res.status(400).json({ success: false, message: 'This appointment is not a telemedicine session' });
    }

    const session = await telemedicineService.createSession(appointment.data, token);
    return res.json(session);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to start telemedicine session',
      error: error.message
    });
  }
};

exports.endTelemedicineSession = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { userId } = req;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Authentication token required' });
    }

    const appointment = await appointmentService.getAppointmentById(appointmentId, token);
    if (!appointment.success) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appointment.data?.doctorId !== userId) {
      return res.status(403).json({ success: false, message: 'You are not authorized to end this session' });
    }

    const session = await telemedicineService.endSession(appointmentId, token);
    return res.json(session);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to end telemedicine session',
      error: error.message
    });
  }
};
