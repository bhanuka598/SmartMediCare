const axios = require("axios");
const { generateServiceToken } = require("./authService");
const { httpRequestWithRetry, CircuitBreaker, withCircuitBreaker } = require("../utils/failureHandler");

// Circuit breaker for telemedicine service
const telemedicineServiceBreaker = new CircuitBreaker("telemedicine-service", {
  failureThreshold: 5,
  resetTimeout: 30000
});

// Retry configuration for telemedicine service calls
const TELEMEDICINE_RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 8000, // Longer timeout for session creation
  backoffMultiplier: 2
};

const createTelemedicineSession = async (appointment) => {
  const operation = async () => {
    const url = `${process.env.TELEMEDICINE_SERVICE_URL}/api/telemedicine/session/create`;
    const serviceToken = generateServiceToken();

    const response = await httpRequestWithRetry(
      {
        method: 'POST',
        url: url,
        data: {
          appointmentId: appointment._id,
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          patientName: appointment.patientName,
          doctorName: appointment.doctorName,
          appointmentDate: appointment.appointmentDate,
          appointmentTime: appointment.appointmentTime
        },
        headers: {
          "Content-Type": "application/json",
          "X-Service-Token": serviceToken,
          "X-Service-Name": "appointment-service"
        }
      },
      TELEMEDICINE_RETRY_CONFIG,
      "telemedicine-service"
    );

    return response.data;
  };
  
  return withCircuitBreaker(
    telemedicineServiceBreaker,
    operation,
    {
      success: false,
      message: "Telemedicine service unavailable - session creation failed"
    }
  );
};

/**
 * Get telemedicine session by appointment ID
 * @param {string} appointmentId - Appointment ID
 * @returns {Promise<Object>} - Session data
 */
const getTelemedicineSession = async (appointmentId) => {
  const operation = async () => {
    const url = `${process.env.TELEMEDICINE_SERVICE_URL}/api/telemedicine/session/${appointmentId}`;
    const serviceToken = generateServiceToken();

    const response = await httpRequestWithRetry(
      {
        method: 'GET',
        url: url,
        headers: {
          "Content-Type": "application/json",
          "X-Service-Token": serviceToken,
          "X-Service-Name": "appointment-service"
        }
      },
      TELEMEDICINE_RETRY_CONFIG,
      "telemedicine-service"
    );

    return response.data;
  };
  
  return withCircuitBreaker(
    telemedicineServiceBreaker,
    operation,
    {
      success: false,
      message: "Telemedicine service unavailable - could not fetch session"
    }
  );
};

/**
 * End telemedicine session
 * @param {string} appointmentId - Appointment ID
 * @returns {Promise<Object>} - End session result
 */
const endTelemedicineSession = async (appointmentId) => {
  const operation = async () => {
    const url = `${process.env.TELEMEDICINE_SERVICE_URL}/api/telemedicine/session/${appointmentId}/end`;
    const serviceToken = generateServiceToken();

    const response = await httpRequestWithRetry(
      {
        method: 'PATCH',
        url: url,
        data: {},
        headers: {
          "Content-Type": "application/json",
          "X-Service-Token": serviceToken,
          "X-Service-Name": "appointment-service"
        }
      },
      TELEMEDICINE_RETRY_CONFIG,
      "telemedicine-service"
    );

    return response.data;
  };
  
  return withCircuitBreaker(
    telemedicineServiceBreaker,
    operation,
    {
      success: false,
      message: "Telemedicine service unavailable - could not end session"
    }
  );
};

/**
 * Get circuit breaker state for monitoring
 * @returns {Object}
 */
const getServiceHealth = () => {
  return telemedicineServiceBreaker.getState();
};

module.exports = {
  createTelemedicineSession,
  getTelemedicineSession,
  endTelemedicineSession,
  getServiceHealth
};