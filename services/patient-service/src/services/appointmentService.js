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

module.exports = {
  getAppointmentById
};
