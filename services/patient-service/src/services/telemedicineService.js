const TELEMEDICINE_SERVICE_URL = process.env.TELEMEDICINE_SERVICE_URL || 'http://localhost:5007';

const getSessionByAppointmentId = async (appointmentId, token) => {
  try {
    const response = await fetch(`${TELEMEDICINE_SERVICE_URL}/api/telemedicine/session/${appointmentId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || `Failed to fetch telemedicine session: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('Patient-service telemedicine fetch error:', error.message);
    throw error;
  }
};

module.exports = {
  getSessionByAppointmentId
};
