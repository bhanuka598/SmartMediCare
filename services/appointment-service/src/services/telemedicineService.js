const axios = require("axios");
const { generateServiceToken } = require("./authService");

const createTelemedicineSession = async (appointment) => {
  try {
    const url = `${process.env.TELEMEDICINE_SERVICE_URL}/api/telemedicine/session/create`;
    const serviceToken = generateServiceToken();

    const response = await axios.post(
      url,
      {
        appointmentId: appointment._id,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        patientName: appointment.patientName,
        doctorName: appointment.doctorName,
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Service-Token": serviceToken,
          "X-Service-Name": "appointment-service"
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error("Telemedicine service error:", error.message);
    return {
      success: false,
      message: "Could not connect to telemedicine-service"
    };
  }
};

/**
 * Get telemedicine session by appointment ID
 * @param {string} appointmentId - Appointment ID
 * @returns {Promise<Object>} - Session data
 */
const getTelemedicineSession = async (appointmentId) => {
  try {
    const url = `${process.env.TELEMEDICINE_SERVICE_URL}/api/telemedicine/session/${appointmentId}`;
    const serviceToken = generateServiceToken();

    const response = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
        "X-Service-Token": serviceToken,
        "X-Service-Name": "appointment-service"
      }
    });

    return response.data;
  } catch (error) {
    console.error("Get telemedicine session error:", error.message);
    return {
      success: false,
      message: "Could not fetch telemedicine session"
    };
  }
};

/**
 * End telemedicine session
 * @param {string} appointmentId - Appointment ID
 * @returns {Promise<Object>} - End session result
 */
const endTelemedicineSession = async (appointmentId) => {
  try {
    const url = `${process.env.TELEMEDICINE_SERVICE_URL}/api/telemedicine/session/${appointmentId}/end`;
    const serviceToken = generateServiceToken();

    const response = await axios.patch(
      url,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          "X-Service-Token": serviceToken,
          "X-Service-Name": "appointment-service"
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error("End telemedicine session error:", error.message);
    return {
      success: false,
      message: "Could not end telemedicine session"
    };
  }
};

module.exports = {
  createTelemedicineSession,
  getTelemedicineSession,
  endTelemedicineSession
};