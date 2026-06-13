/**
 * Appointment Service Client for Telemedicine Service
 * Handles inter-service communication with appointment service
 */

const axios = require("axios");
const { httpRequestWithRetry, CircuitBreaker, withCircuitBreaker } = require("../utils/failureHandler");
const jwt = require("jsonwebtoken");

const APPOINTMENT_SERVICE_URL = process.env.APPOINTMENT_SERVICE_URL || "http://localhost:5001";
const INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET || "secret";

// Circuit breaker for appointment service
const appointmentServiceBreaker = new CircuitBreaker("appointment-service", {
  failureThreshold: 5,
  resetTimeout: 30000
});

// Retry configuration for appointment service calls
const APPOINTMENT_RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 5000,
  backoffMultiplier: 2
};

/**
 * Generate internal service token for service-to-service communication
 * @returns {string} - JWT service token
 */
const generateServiceToken = () => {
  return jwt.sign(
    { service: "telemedicine-service" },
    INTERNAL_SERVICE_SECRET,
    { expiresIn: "1h" }
  );
};

/**
 * Get appointment by ID from appointment service
 * @param {string} appointmentId - Appointment ID
 * @returns {Promise<Object>} - Appointment data
 */
const getAppointmentById = async (appointmentId) => {
  const operation = async () => {
    const url = `${APPOINTMENT_SERVICE_URL}/api/appointments/internal/${appointmentId}`;
    const serviceToken = generateServiceToken();

    const response = await httpRequestWithRetry(
      {
        method: 'GET',
        url: url,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serviceToken}`,
          "X-Service-Token": serviceToken,
          "X-Service-Name": "telemedicine-service"
        }
      },
      APPOINTMENT_RETRY_CONFIG,
      "appointment-service"
    );

    return response.data;
  };
  
  return withCircuitBreaker(
    appointmentServiceBreaker,
    operation,
    {
      success: false,
      message: "Appointment service unavailable - could not fetch appointment"
    }
  );
};

/**
 * Verify appointment exists and is valid for telemedicine
 * @param {string} appointmentId - Appointment ID
 * @param {string} patientId - Expected patient ID
 * @param {string} doctorId - Expected doctor ID
 * @returns {Promise<Object>} - Verification result
 */
const verifyAppointment = async (appointmentId, patientId, doctorId) => {
  try {
    const result = await getAppointmentById(appointmentId);
    
    if (!result.success) {
      return {
        valid: false,
        message: "Appointment not found"
      };
    }

    const appointment = result.data;

    // Verify patient and doctor match
    if (appointment.patientId !== patientId) {
      return {
        valid: false,
        message: "Patient ID does not match appointment"
      };
    }

    if (appointment.doctorId !== doctorId) {
      return {
        valid: false,
        message: "Doctor ID does not match appointment"
      };
    }

    // Check if appointment is confirmed or in-progress (eligible for telemedicine)
    const validStatuses = ["CONFIRMED", "IN_PROGRESS"];
    if (!validStatuses.includes(appointment.status)) {
      return {
        valid: false,
        message: `Appointment status '${appointment.status}' does not allow telemedicine session. Must be CONFIRMED or IN_PROGRESS`
      };
    }

    // Check if appointment type supports telemedicine
    if (appointment.type && appointment.type !== "TELEMEDICINE") {
      return {
        valid: false,
        message: `Appointment type '${appointment.type}' does not support telemedicine`
      };
    }

    return {
      valid: true,
      appointment: appointment
    };
  } catch (error) {
    console.error("[appointment-service] Error verifying appointment:", error.message);
    return {
      valid: false,
      message: "Error verifying appointment: " + error.message
    };
  }
};

/**
 * Update appointment status
 * @param {string} appointmentId - Appointment ID
 * @param {string} status - New status (e.g., "IN_PROGRESS", "COMPLETED")
 * @param {Object} additionalData - Additional data like notes, prescription
 * @returns {Promise<Object>} - Update result
 */
const updateAppointmentStatus = async (appointmentId, status, additionalData = {}) => {
  const operation = async () => {
    let endpoint;
    let method = 'PATCH';
    let data = {};

    // Map status to appropriate endpoint
    switch (status) {
      case "IN_PROGRESS":
        endpoint = `${APPOINTMENT_SERVICE_URL}/api/appointments/internal/${appointmentId}/in-progress`;
        break;
      case "COMPLETED":
        endpoint = `${APPOINTMENT_SERVICE_URL}/api/appointments/internal/${appointmentId}/complete`;
        data = {
          notes: additionalData.notes || "Consultation completed via telemedicine",
          prescription: additionalData.prescription || null
        };
        break;
      case "NO_SHOW":
        endpoint = `${APPOINTMENT_SERVICE_URL}/api/appointments/internal/${appointmentId}/no-show`;
        break;
      default:
        endpoint = `${APPOINTMENT_SERVICE_URL}/api/appointments/internal/${appointmentId}`;
        method = 'PUT';
        data = { status };
    }

    const serviceToken = generateServiceToken();

    const response = await httpRequestWithRetry(
      {
        method: method,
        url: endpoint,
        data: data,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serviceToken}`,
          "X-Service-Token": serviceToken,
          "X-Service-Name": "telemedicine-service"
        }
      },
      APPOINTMENT_RETRY_CONFIG,
      "appointment-service"
    );

    return response.data;
  };
  
  return withCircuitBreaker(
    appointmentServiceBreaker,
    operation,
    {
      success: false,
      message: `Appointment service unavailable - could not update status to ${status}`
    }
  );
};

/**
 * Mark appointment as in-progress (when session starts)
 * @param {string} appointmentId - Appointment ID
 * @returns {Promise<Object>} - Update result
 */
const markAppointmentInProgress = async (appointmentId) => {
  return updateAppointmentStatus(appointmentId, "IN_PROGRESS");
};

/**
 * Mark appointment as completed (when session ends)
 * @param {string} appointmentId - Appointment ID
 * @param {Object} sessionData - Session data for notes
 * @returns {Promise<Object>} - Update result
 */
const markAppointmentCompleted = async (appointmentId, sessionData = {}) => {
  return updateAppointmentStatus(appointmentId, "COMPLETED", {
    notes: sessionData.notes || `Telemedicine session completed. Duration: ${sessionData.duration || 'N/A'} minutes`,
    prescription: sessionData.prescription
  });
};

/**
 * Get circuit breaker state for monitoring
 * @returns {Object}
 */
const getServiceHealth = () => {
  return appointmentServiceBreaker.getState();
};

module.exports = {
  getAppointmentById,
  verifyAppointment,
  updateAppointmentStatus,
  markAppointmentInProgress,
  markAppointmentCompleted,
  getServiceHealth,
  generateServiceToken,
  APPOINTMENT_SERVICE_URL
};
