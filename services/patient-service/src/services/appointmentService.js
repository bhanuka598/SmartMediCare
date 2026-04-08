const APPOINTMENT_SERVICE_URL = process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:5001';

const getAppointmentById = async (appointmentId, token) => {
  try {
    const response = await fetch(`${APPOINTMENT_SERVICE_URL}/api/appointments/${appointmentId}/details`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || `Failed to fetch appointment: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('Patient-service appointment fetch error:', error.message);
    throw error;
  }
};

const getDoctorAppointments = async (doctorId, token, filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);

    const queryString = queryParams.toString();
    const response = await fetch(
      `${APPOINTMENT_SERVICE_URL}/api/appointments/doctor/${doctorId}${queryString ? `?${queryString}` : ''}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || `Failed to fetch doctor appointments: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('Patient-service doctor appointments fetch error:', error.message);
    throw error;
  }
};

module.exports = {
  getAppointmentById,
  getDoctorAppointments
};
