const TELEMEDICINE_SERVICE_URL = process.env.TELEMEDICINE_SERVICE_URL || 'http://localhost:5007';

const getSessionByAppointmentId = async (appointmentId, token) => {
  try {
    const response = await fetch(
      `${TELEMEDICINE_SERVICE_URL}/api/telemedicine/session/${appointmentId}`,
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
      throw new Error(data.message || `Failed to fetch telemedicine session: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('Telemedicine service get session error:', error.message);
    throw error;
  }
};

const createSession = async (appointment, token) => {
  try {
    const response = await fetch(
      `${TELEMEDICINE_SERVICE_URL}/api/telemedicine/session/create`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appointmentId: appointment._id || appointment.id,
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          patientName: appointment.patientName,
          doctorName: appointment.doctorName,
          appointmentDate: appointment.appointmentDate,
          appointmentTime: appointment.appointmentTime
        })
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || `Failed to create telemedicine session: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('Telemedicine service create session error:', error.message);
    throw error;
  }
};

const endSession = async (appointmentId, token) => {
  try {
    const response = await fetch(
      `${TELEMEDICINE_SERVICE_URL}/api/telemedicine/session/${appointmentId}/end`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || `Failed to end telemedicine session: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('Telemedicine service end session error:', error.message);
    throw error;
  }
};

module.exports = {
  getSessionByAppointmentId,
  createSession,
  endSession
};
