/**
 * Patient Service Client for Appointment Service
 * Handles inter-service communication with patient service
 */

const axios = require("axios");
const { generateServiceToken } = require("./authService");

const PATIENT_SERVICE_URL =
  process.env.PATIENT_SERVICE_URL || "http://localhost:5005";

/**
 * Get patient by ID from patient service
 * @param {string} patientId - Patient ID
 * @returns {Promise<Object>} - Patient data
 */
const getPatientById = async (patientId) => {
  try {
    const url = `${PATIENT_SERVICE_URL}/api/patients/${patientId}`;
    const serviceToken = generateServiceToken();

    const response = await axios.get(url, {
      headers: {
        "X-Service-Token": serviceToken,
        "X-Service-Name": "appointment-service"
      }
    });

    return {
      success: true,
      data: response.data.data || response.data
    };
  } catch (error) {
    console.error("Patient service error:", error.message);
    return {
      success: false,
      message: "Could not fetch patient data",
      error: error.message
    };
  }
};

/**
 * Get patient profile by ID from patient service
 * @param {string} patientId - Patient ID
 * @returns {Promise<Object>} - Patient profile data
 */
const getPatientProfile = async (patientId) => {
  try {
    const url = `${PATIENT_SERVICE_URL}/api/patients/${patientId}/profile`;
    const serviceToken = generateServiceToken();

    const response = await axios.get(url, {
      headers: {
        "X-Service-Token": serviceToken,
        "X-Service-Name": "appointment-service"
      }
    });

    return {
      success: true,
      data: response.data.data || response.data
    };
  } catch (error) {
    console.error("Patient profile fetch error:", error.message);
    return {
      success: false,
      message: "Could not fetch patient profile",
      error: error.message
    };
  }
};

/**
 * Get patient medical history from patient service
 * @param {string} patientId - Patient ID
 * @returns {Promise<Object>} - Medical history data
 */
const getPatientMedicalHistory = async (patientId) => {
  try {
    const url = `${PATIENT_SERVICE_URL}/api/patients/${patientId}/medical-history`;
    const serviceToken = generateServiceToken();

    const response = await axios.get(url, {
      headers: {
        "X-Service-Token": serviceToken,
        "X-Service-Name": "appointment-service"
      }
    });

    return {
      success: true,
      data: response.data.data || response.data
    };
  } catch (error) {
    console.error("Medical history fetch error:", error.message);
    return {
      success: false,
      message: "Could not fetch medical history",
      error: error.message
    };
  }
};

/**
 * Validate if patient exists by checking with patient service
 * @param {string} patientId - Patient ID to validate
 * @returns {Promise<Object>} - Validation result with patient data if exists
 */
const validatePatient = async (patientId) => {
  try {
    const patient = await getPatientById(patientId);
    return {
      success: patient.success,
      isValid: patient.success && patient.data,
      data: patient.data || null
    };
  } catch (error) {
    return {
      success: false,
      isValid: false,
      message: error.message
    };
  }
};

/**
 * Get patient name by ID
 * @param {string} patientId - Patient ID
 * @returns {Promise<string|null>} - Patient name or null if not found
 */
const getPatientNameById = async (patientId) => {
  try {
    const result = await validatePatient(patientId);
    if (result.success && result.data) {
      return (
        result.data.name ||
        result.data.fullName ||
        result.data.username ||
        null
      );
    }
    return null;
  } catch (error) {
    console.error("Get patient name error:", error.message);
    return null;
  }
};

/**
 * Sync patient data with appointment service
 * Called when patient profile is updated
 * @param {Object} patientData - Patient data to sync
 * @returns {Promise<Object>} - Sync result
 */
const syncPatientData = async (patientData) => {
  try {
    const serviceToken = generateServiceToken();
    const response = await axios.post(
      `${PATIENT_SERVICE_URL}/sync`,
      patientData,
      {
        headers: {
          Authorization: `Bearer ${serviceToken}`,
          "Content-Type": "application/json",
          "X-Service-Name": "appointment-service"
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error("Patient sync error:", error.message);
    return {
      success: false,
      message: error.response?.data?.message || "Could not sync patient data"
    };
  }
};

/**
 * Check if patient service is healthy
 * @returns {Promise<boolean>}
 */
const isPatientServiceHealthy = async () => {
  try {
    const response = await axios.get(`${PATIENT_SERVICE_URL}/health`, {
      timeout: 5000
    });
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

module.exports = {
  getPatientById,
  getPatientProfile,
  getPatientMedicalHistory,
  validatePatient,
  getPatientNameById,
  syncPatientData,
  isPatientServiceHealthy,
  PATIENT_SERVICE_URL
};
