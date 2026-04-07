const axios = require("axios");

const createTelemedicineSession = async (appointment) => {
  try {
    const url = `${process.env.TELEMEDICINE_SERVICE_URL}/api/telemedicine/session/create`;

    const response = await axios.post(url, {
      appointmentId: appointment._id,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      patientName: appointment.patientName,
      doctorName: appointment.doctorName,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime
    });

    return response.data;
  } catch (error) {
    return {
      success: false,
      message: "Could not connect to telemedicine-service"
    };
  }
};

module.exports = {
  createTelemedicineSession
};