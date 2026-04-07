const axios = require("axios");
const { generateServiceToken } = require("./authService");

const searchDoctorsBySpecialtyFromDoctorService = async (specialty) => {
  try {
    const url = `${process.env.DOCTOR_SERVICE_URL}/api/doctors/search`;
    const serviceToken = generateServiceToken();
    
    const response = await axios.get(url, {
      params: { specialty },
      headers: {
        "X-Service-Token": serviceToken,
        "X-Service-Name": "appointment-service"
      }
    });
    return response.data;
  } catch (error) {
    console.error("Doctor service error:", error.message);
    return {
      success: false,
      message: "Could not connect to doctor-service",
      data: []
    };
  }
};

/**
 * Get doctor availability from doctor service
 * @param {string} doctorId - Doctor ID
 * @returns {Promise<Object>} - Doctor availability data
 */
const getDoctorAvailability = async (doctorId) => {
  try {
    const url = `${process.env.DOCTOR_SERVICE_URL}/api/doctors/${doctorId}/availability`;
    const serviceToken = generateServiceToken();
    
    const response = await axios.get(url, {
      headers: {
        "X-Service-Token": serviceToken,
        "X-Service-Name": "appointment-service"
      }
    });
    return response.data;
  } catch (error) {
    console.error("Doctor availability fetch error:", error.message);
    return {
      success: false,
      message: "Could not fetch doctor availability",
      data: null
    };
  }
};

module.exports = {
  searchDoctorsBySpecialtyFromDoctorService,
  getDoctorAvailability
};