/**
 * Auth Service Client
 * Handles inter-service communication with auth service
 * Uses hardcoded configuration - no environment variables required
 */

const AUTH_SERVICE_URL = 'http://localhost:5002';
const INTERNAL_SERVICE_SECRET = 'secret';

/**
 * Verify token with auth service
 * @param {string} token - JWT token
 * @returns {Promise<Object>} - User data if valid
 */
const verifyTokenWithAuthService = async (token) => {
  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/verify-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Token verification failed');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Auth service communication error:', error.message);
    throw error;
  }
};

/**
 * Get user profile from auth service
 * @param {string} token - JWT token
 * @returns {Promise<Object>} - User profile data
 */
const getUserProfileFromAuthService = async (token) => {
  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get user profile');
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Auth service profile fetch error:', error.message);
    throw error;
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
    const response = await fetch(`${AUTH_SERVICE_URL}/internal/users/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${serviceToken}`,
        'Content-Type': 'application/json',
        'X-Service-Name': 'doctor-service'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get user by ID');
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Auth service get user by ID error:', error.message);
    throw error;
  }
};

/**
 * Check if auth service is healthy
 * @returns {Promise<boolean>}
 */
const isAuthServiceHealthy = async () => {
  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/health`, {
      method: 'GET',
      timeout: 5000
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};

module.exports = {
  verifyTokenWithAuthService,
  getUserProfileFromAuthService,
  getUserByIdFromAuthService,
  isAuthServiceHealthy,
  AUTH_SERVICE_URL,
  INTERNAL_SERVICE_SECRET
};
