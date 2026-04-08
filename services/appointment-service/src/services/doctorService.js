const { httpRequestWithRetry, CircuitBreaker, withCircuitBreaker } = require("../utils/failureHandler");

// Circuit breaker for doctor service
const doctorServiceBreaker = new CircuitBreaker("doctor-service", {
  failureThreshold: 5,
  resetTimeout: 30000
});

// Retry configuration for doctor service calls
const DOCTOR_SERVICE_RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 5000,
  backoffMultiplier: 2
};

const searchDoctorsBySpecialtyFromDoctorService = async (specialty) => {
  const operation = async () => {
    const url = `${process.env.DOCTOR_SERVICE_URL}/api/doctors/search`;
    
    const response = await httpRequestWithRetry(
      {
        method: 'GET',
        url: url,
        params: { specialization: specialty }
      },
      DOCTOR_SERVICE_RETRY_CONFIG,
      "doctor-service"
    );
    
    return response.data;
  };
  
  // Execute with circuit breaker and fallback
  return withCircuitBreaker(
    doctorServiceBreaker,
    operation,
    {
      success: false,
      message: "Doctor service unavailable - using cached/default data",
      data: []
    }
  );
};

const getAllDoctorsFromDoctorService = async () => {
  const operation = async () => {
    const url = `${process.env.DOCTOR_SERVICE_URL}/api/doctors/search`;
    
    const response = await httpRequestWithRetry(
      {
        method: 'GET',
        url
      },
      DOCTOR_SERVICE_RETRY_CONFIG,
      "doctor-service"
    );
    
    return response.data;
  };
  
  // Execute with circuit breaker and fallback
  return withCircuitBreaker(
    doctorServiceBreaker,
    operation,
    {
      success: false,
      message: "Doctor service unavailable - using cached/default data",
      data: []
    }
  );
};

const getDoctorById = async (doctorId) => {
  const operation = async () => {
    const { generateServiceToken } = require("./authService");
    const serviceToken = generateServiceToken();
    const url = `${process.env.DOCTOR_SERVICE_URL}/api/doctors/internal/${doctorId}`;

    const response = await httpRequestWithRetry(
      {
        method: "GET",
        url,
        headers: {
          "X-Service-Token": serviceToken,
          "X-Service-Name": "appointment-service"
        }
      },
      DOCTOR_SERVICE_RETRY_CONFIG,
      "doctor-service"
    );

    return {
      success: true,
      data: response.data.data || response.data
    };
  };

  return withCircuitBreaker(
    doctorServiceBreaker,
    operation,
    {
      success: false,
      message: "Doctor service unavailable",
      error: "Service temporarily unavailable"
    }
  );
};

/**
 * Get doctor availability from doctor service
 * @param {string} doctorId - Doctor ID
 * @returns {Promise<Object>} - Doctor availability data
 */
const getDoctorAvailability = async (doctorId) => {
  const operation = async () => {
    const url = `${process.env.DOCTOR_SERVICE_URL}/api/doctors/public/${doctorId}/availability`;
    
    const response = await httpRequestWithRetry(
      {
        method: 'GET',
        url
      },
      DOCTOR_SERVICE_RETRY_CONFIG,
      "doctor-service"
    );
    
    return response.data;
  };
  
  return withCircuitBreaker(
    doctorServiceBreaker,
    operation,
    {
      success: false,
      message: "Doctor availability service unavailable",
      data: null
    }
  );
};

/**
 * Get circuit breaker state for monitoring
 * @returns {Object}
 */
const getServiceHealth = () => {
  return doctorServiceBreaker.getState();
};

module.exports = {
  searchDoctorsBySpecialtyFromDoctorService,
  getAllDoctorsFromDoctorService,
  getDoctorById,
  getDoctorAvailability,
  getServiceHealth
};
