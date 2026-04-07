const axios = require("axios");

const searchDoctorsBySpecialtyFromDoctorService = async (specialty) => {
  try {
    const url = `${process.env.DOCTOR_SERVICE_URL}/api/doctors/search`;
    const response = await axios.get(url, {
      params: { specialty }
    });
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: "Could not connect to doctor-service",
      data: []
    };
  }
};

module.exports = {
  searchDoctorsBySpecialtyFromDoctorService
};