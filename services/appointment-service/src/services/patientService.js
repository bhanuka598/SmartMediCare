/**
 * Patient Service Client for Appointment Service
 * Handles inter-service communication with patient service
 */

const axios = require("axios");

const PATIENT_SERVICE_URL =
  process.env.PATIENT_SERVICE_URL || "http://localhost:5003";

/**
 * Get patient profile by ID from patient service
 * @param {string} patientId - Patient ID
 * @param {string} token - JWT token (patient's token or service token)
 * @returns {Promise<Object>} - Patient profile data
 */
const getPatientProfile = async (patientId, token) => {
  try {
    const response = await axios.get(
      `${PATIENT_SERVICE_URL}/api/patients/profile`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error("Patient service communication error:", error.message);
    return {
      success: false,
      message: error.response?.data?.message || "Could not connect to patient-service"
    };
  }
};

/**
 * Validate if patient exists by checking with patient service
 * @param {string} patientId - Patient ID to validate
 * @param {string} serviceToken - Internal service token for authentication
 * @returns {Promise<Object>} - Validation result with patient data if exists
 */
const validatePatientExists = async (patientId, serviceToken) => {
  try {
    // Use internal endpoint or patient profile endpoint
    const response = await axios.get(
      `${PATIENT_SERVICE_URL}/api/patients/profile`,
      {
        headers: {
          Authorization: `Bearer ${serviceToken}`,
          "Content-Type": "application/json",
          "X-Service-Name": "appointment-service"
        }
      }
    );

    if (response.data && response.data.success) {
      return {
        success: true,
        exists: true,
        patient: response.data.data
      };
    }

    return {
      success: false,
      exists: false,
      message: "Patient not found"
    };
  } catch (error) {
    console.error("Patient validation error:", error.message);
    return {
      success: false,
      exists: false,
      message: error.response?.data?.message || "Could not validate patient"
    };
  }
};

/**
 * Sync patient data with appointment service
 * Called when patient profile is updated
 * @param {Object} patientData - Patient data to sync
 * @param {string} serviceToken - Internal service token
 * @returns {Promise<Object>} - Sync result
 */
const syncPatientData = async (patientData, serviceToken) => {
  try {
    const response = await axios.post(
      `${PATIENT_SERVICE_URL}/api/patients/sync`,
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
 * Get patient name by ID
 * @param {string} patientId - Patient ID
 * @param {string} token - Auth token
 * @returns {Promise<string|null>} - Patient name or null if not found
 */
const getPatientNameById = async (patientId, token) => {
  try {
    const result = await validatePatientExists(patientId, token);
    if (result.success && result.patient) {
      return (
        result.patient.name ||
        result.patient.fullName ||
        result.patient.username ||
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
  getPatientProfile,
  validatePatientExists,
  syncPatientData,
  getPatientNameById,
  isPatientServiceHealthy,
  PATIENT_SERVICE_URL
};
