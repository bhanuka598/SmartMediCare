/**
 * Patient Service Client for Appointment Service
 * Handles inter-service communication with patient service
 */

const axios = require("axios");
const { generateServiceToken } = require("./authService");
const { httpRequestWithRetry, CircuitBreaker, withCircuitBreaker } = require("../utils/failureHandler");

const PATIENT_SERVICE_URL =
  process.env.PATIENT_SERVICE_URL || "http://localhost:5005";

// Circuit breaker for patient service
const patientServiceBreaker = new CircuitBreaker("patient-service", {
  failureThreshold: 5,
  resetTimeout: 30000
});

// Retry configuration for patient service calls
const PATIENT_SERVICE_RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 5000,
  backoffMultiplier: 2
};

/**
 * Get patient by ID from patient service
 * @param {string} patientId - Patient ID
 * @returns {Promise<Object>} - Patient data
 */
const getPatientById = async (patientId) => {
  const operation = async () => {
    const url = `${PATIENT_SERVICE_URL}/api/patients/${patientId}`;
    const serviceToken = generateServiceToken();

    const response = await httpRequestWithRetry(
      {
        method: 'GET',
        url: url,
        headers: {
          "X-Service-Token": serviceToken,
          "X-Service-Name": "appointment-service"
        }
      },
      PATIENT_SERVICE_RETRY_CONFIG,
      "patient-service"
    );

    return {
      success: true,
      data: response.data.data || response.data
    };
  };
  
  return withCircuitBreaker(
    patientServiceBreaker,
    operation,
    {
      success: false,
      message: "Patient service unavailable",
      error: "Service temporarily unavailable"
    }
  );
};

/**
 * Get patient profile by ID from patient service
 * @param {string} patientId - Patient ID
 * @returns {Promise<Object>} - Patient profile data
 */
const getPatientProfile = async (patientId) => {
  const operation = async () => {
    const url = `${PATIENT_SERVICE_URL}/api/patients/${patientId}/profile`;
    const serviceToken = generateServiceToken();

    const response = await httpRequestWithRetry(
      {
        method: 'GET',
        url: url,
        headers: {
          "X-Service-Token": serviceToken,
          "X-Service-Name": "appointment-service"
        }
      },
      PATIENT_SERVICE_RETRY_CONFIG,
      "patient-service"
    );

    return {
      success: true,
      data: response.data.data || response.data
    };
  };
  
  return withCircuitBreaker(
    patientServiceBreaker,
    operation,
    {
      success: false,
      message: "Patient profile service unavailable",
      error: "Service temporarily unavailable"
    }
  );
};

/**
 * Get patient medical history from patient service
 * @param {string} patientId - Patient ID
 * @returns {Promise<Object>} - Medical history data
 */
const getPatientMedicalHistory = async (patientId) => {
  const operation = async () => {
    const url = `${PATIENT_SERVICE_URL}/api/patients/${patientId}/medical-history`;
    const serviceToken = generateServiceToken();

    const response = await httpRequestWithRetry(
      {
        method: 'GET',
        url: url,
        headers: {
          "X-Service-Token": serviceToken,
          "X-Service-Name": "appointment-service"
        }
      },
      PATIENT_SERVICE_RETRY_CONFIG,
      "patient-service"
    );

    return {
      success: true,
      data: response.data.data || response.data
    };
  };
  
  return withCircuitBreaker(
    patientServiceBreaker,
    operation,
    {
      success: false,
      message: "Medical history service unavailable",
      error: "Service temporarily unavailable"
    }
  );
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
  const operation = async () => {
    const serviceToken = generateServiceToken();
    const response = await httpRequestWithRetry(
      {
        method: 'POST',
        url: `${PATIENT_SERVICE_URL}/sync`,
        data: patientData,
        headers: {
          Authorization: `Bearer ${serviceToken}`,
          "Content-Type": "application/json",
          "X-Service-Name": "appointment-service"
        }
      },
      PATIENT_SERVICE_RETRY_CONFIG,
      "patient-service"
    );
    return response.data;
  };
  
  return withCircuitBreaker(
    patientServiceBreaker,
    operation,
    {
      success: false,
      message: "Patient sync service unavailable"
    }
  );
};

/**
 * Check if patient service is healthy
 * @returns {Promise<boolean>}
 */
const isPatientServiceHealthy = async () => {
  try {
    const response = await httpRequestWithRetry(
      {
        method: 'GET',
        url: `${PATIENT_SERVICE_URL}/health`
      },
      { maxRetries: 1, timeout: 3000 },
      "patient-service"
    );
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

/**
 * Get circuit breaker state for monitoring
 * @returns {Object}
 */
const getServiceHealth = () => {
  return patientServiceBreaker.getState();
};

module.exports = {
  getPatientById,
  getPatientProfile,
  getPatientMedicalHistory,
  validatePatient,
  getPatientNameById,
  syncPatientData,
  isPatientServiceHealthy,
  getServiceHealth,
  PATIENT_SERVICE_URL
};
