/**
 * Auth Service Client for Appointment Service
 * Handles inter-service communication with auth service
 */

const axios = require("axios");
const { httpRequestWithRetry, CircuitBreaker, withCircuitBreaker } = require("../utils/failureHandler");

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:5002";
const INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET || "secret";

// Circuit breaker for auth service
const authServiceBreaker = new CircuitBreaker("auth-service", {
  failureThreshold: 5,
  resetTimeout: 30000
});

// Retry configuration for auth service calls
const AUTH_SERVICE_RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 5000,
  backoffMultiplier: 2
};

/**
 * Verify token with auth service
 * @param {string} token - JWT token
 * @returns {Promise<Object>} - User data if valid
 */
const verifyTokenWithAuthService = async (token) => {
  const operation = async () => {
    const response = await httpRequestWithRetry(
      {
        method: 'POST',
        url: `${AUTH_SERVICE_URL}/api/auth/verify-token`,
        data: { token },
        headers: { "Content-Type": "application/json" }
      },
      AUTH_SERVICE_RETRY_CONFIG,
      "auth-service"
    );
    return response.data;
  };
  
  return withCircuitBreaker(
    authServiceBreaker,
    operation,
    { valid: false, message: "Auth service unavailable" }
  );
};

/**
 * Get user profile from auth service
 * @param {string} token - JWT token
 * @returns {Promise<Object>} - User profile data
 */
const getUserProfileFromAuthService = async (token) => {
  const operation = async () => {
    const response = await httpRequestWithRetry(
      {
        method: 'GET',
        url: `${AUTH_SERVICE_URL}/api/auth/me`,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      },
      AUTH_SERVICE_RETRY_CONFIG,
      "auth-service"
    );
    return response.data.user;
  };
  
  return withCircuitBreaker(
    authServiceBreaker,
    operation,
    null
  );
};

/**
 * Get user by ID from auth service (internal endpoint)
 * @param {string} userId - User ID
 * @param {string} serviceToken - Internal service token for authentication
 * @returns {Promise<Object>} - User data
 */
const getUserByIdFromAuthService = async (userId, serviceToken) => {
  const operation = async () => {
    const response = await httpRequestWithRetry(
      {
        method: 'GET',
        url: `${AUTH_SERVICE_URL}/internal/users/${userId}`,
        headers: {
          Authorization: `Bearer ${serviceToken}`,
          "Content-Type": "application/json",
          "X-Service-Name": "appointment-service"
        }
      },
      AUTH_SERVICE_RETRY_CONFIG,
      "auth-service"
    );
    return response.data.user;
  };
  
  return withCircuitBreaker(
    authServiceBreaker,
    operation,
    null
  );
};

/**
 * Check if auth service is healthy
 * @returns {Promise<boolean>}
 */
const isAuthServiceHealthy = async () => {
  try {
    const response = await httpRequestWithRetry(
      {
        method: 'GET',
        url: `${AUTH_SERVICE_URL}/health`
      },
      { maxRetries: 1, timeout: 3000 },
      "auth-service"
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
  return authServiceBreaker.getState();
};

/**
 * Generate internal service token for service-to-service communication
 * @returns {string} - JWT service token
 */
const generateServiceToken = () => {
  const jwt = require("jsonwebtoken");
  return jwt.sign(
    { service: "appointment-service" },
    INTERNAL_SERVICE_SECRET,
    { expiresIn: "1h" }
  );
};

module.exports = {
  verifyTokenWithAuthService,
  getUserProfileFromAuthService,
  getUserByIdFromAuthService,
  isAuthServiceHealthy,
  generateServiceToken,
  AUTH_SERVICE_URL,
  INTERNAL_SERVICE_SECRET
};
