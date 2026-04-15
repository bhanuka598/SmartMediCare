/**
 * Appointment Service Client
 * Handles inter-service communication with appointment service
 */

const APPOINTMENT_SERVICE_URL = process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:5001';

/**
 * Get doctor's appointments from appointment service
 * @param {string} doctorId - Doctor ID
 * @param {string} token - JWT token for authentication
 * @param {Object} filters - Optional filters (status, dateFrom, dateTo, etc.)
 * @returns {Promise<Object>} - Appointments data
 */
const getDoctorAppointments = async (doctorId, token, filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);

    const queryString = queryParams.toString();
    const url = `${APPOINTMENT_SERVICE_URL}/api/appointments/doctor/${doctorId}${queryString ? '?' + queryString : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Failed to fetch appointments: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Appointment service get appointments error:', error.message);
    throw error;
  }
};

/**
 * Confirm an appointment
 * @param {string} appointmentId - Appointment ID
 * @param {string} token - JWT token for authentication
 * @returns {Promise<Object>} - Result of the operation
 */
const confirmAppointment = async (appointmentId, token) => {
  try {
    const response = await fetch(`${APPOINTMENT_SERVICE_URL}/api/appointments/${appointmentId}/confirm`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Failed to confirm appointment: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Appointment service confirm error:', error.message);
    throw error;
  }
};

/**
 * Reject an appointment
 * @param {string} appointmentId - Appointment ID
 * @param {string} token - JWT token for authentication
 * @param {string} reason - Reason for rejection (optional)
 * @returns {Promise<Object>} - Result of the operation
 */
const rejectAppointment = async (appointmentId, token, reason = '') => {
  try {
    const response = await fetch(`${APPOINTMENT_SERVICE_URL}/api/appointments/${appointmentId}/reject`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Failed to reject appointment: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Appointment service reject error:', error.message);
    throw error;
  }
};

/**
 * Complete an appointment
 * @param {string} appointmentId - Appointment ID
 * @param {string} token - JWT token for authentication
 * @param {Object} data - Completion data (notes, prescription, etc.)
 * @returns {Promise<Object>} - Result of the operation
 */
const completeAppointment = async (appointmentId, token, data = {}) => {
  try {
    const response = await fetch(`${APPOINTMENT_SERVICE_URL}/api/appointments/${appointmentId}/complete`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Failed to complete appointment: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Appointment service complete error:', error.message);
    throw error;
  }
};

/**
 * Mark appointment as in-progress
 * @param {string} appointmentId - Appointment ID
 * @param {string} token - JWT token for authentication
 * @returns {Promise<Object>} - Result of the operation
 */
const markInProgress = async (appointmentId, token) => {
  try {
    const response = await fetch(`${APPOINTMENT_SERVICE_URL}/api/appointments/${appointmentId}/in-progress`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Failed to mark appointment in progress: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Appointment service in-progress error:', error.message);
    throw error;
  }
};

/**
 * Mark appointment as no-show
 * @param {string} appointmentId - Appointment ID
 * @param {string} token - JWT token for authentication
 * @returns {Promise<Object>} - Result of the operation
 */
const markNoShow = async (appointmentId, token) => {
  try {
    const response = await fetch(`${APPOINTMENT_SERVICE_URL}/api/appointments/${appointmentId}/no-show`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Failed to mark no-show: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Appointment service no-show error:', error.message);
    throw error;
  }
};

/**
 * Get single appointment details
 * @param {string} appointmentId - Appointment ID
 * @param {string} token - JWT token for authentication
 * @returns {Promise<Object>} - Appointment data
 */
const getAppointmentById = async (appointmentId, token) => {
  try {
    const response = await fetch(`${APPOINTMENT_SERVICE_URL}/api/appointments/${appointmentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Failed to fetch appointment: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Appointment service get by ID error:', error.message);
    throw error;
  }
};

/**
 * Check if appointment service is healthy
 * @returns {Promise<boolean>}
 */
const isAppointmentServiceHealthy = async () => {
  try {
    const response = await fetch(`${APPOINTMENT_SERVICE_URL}/health`, {
      method: 'GET',
      timeout: 5000
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};

module.exports = {
  getDoctorAppointments,
  confirmAppointment,
  rejectAppointment,
  completeAppointment,
  markInProgress,
  markNoShow,
  getAppointmentById,
  isAppointmentServiceHealthy,
  APPOINTMENT_SERVICE_URL
};
