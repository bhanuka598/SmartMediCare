/**
 * Auth Service Client for Appointment Service
 * Handles inter-service communication with auth service
 */

const axios = require("axios");

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:5002";
const INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET || "secret";

/**
 * Verify token with auth service
 * @param {string} token - JWT token
 * @returns {Promise<Object>} - User data if valid
 */
const verifyTokenWithAuthService = async (token) => {
  try {
    const response = await axios.post(
      `${AUTH_SERVICE_URL}/api/auth/verify-token`,
      { token },
      {
        headers: { "Content-Type": "application/json" }
      }
    );
    return response.data;
  } catch (error) {
    console.error("Auth service communication error:", error.message);
    throw new Error(error.response?.data?.message || "Token verification failed");
  }
};

/**
 * Get user profile from auth service
 * @param {string} token - JWT token
 * @returns {Promise<Object>} - User profile data
 */
const getUserProfileFromAuthService = async (token) => {
  try {
    const response = await axios.get(`${AUTH_SERVICE_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    return response.data.user;
  } catch (error) {
    console.error("Auth service profile fetch error:", error.message);
    throw new Error(error.response?.data?.message || "Failed to get user profile");
  }
};

/**
 * Get user by ID from auth service (internal endpoint)
 * @param {string} userId - User ID
 * @param {string} serviceToken - Internal service token for authentication
 * @returns {Promise<Object>} - User data
 */
const getUserByIdFromAuthService = async (userId, serviceToken) => {
  try {
    const response = await axios.get(
      `${AUTH_SERVICE_URL}/internal/users/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${serviceToken}`,
          "Content-Type": "application/json",
          "X-Service-Name": "appointment-service"
        }
      }
    );
    return response.data.user;
  } catch (error) {
    console.error("Auth service get user by ID error:", error.message);
    throw new Error(error.response?.data?.message || "Failed to get user by ID");
  }
};

/**
 * Check if auth service is healthy
 * @returns {Promise<boolean>}
 */
const isAuthServiceHealthy = async () => {
  try {
    const response = await axios.get(`${AUTH_SERVICE_URL}/health`, {
      timeout: 5000
    });
    return response.status === 200;
  } catch (error) {
    return false;
  }
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
