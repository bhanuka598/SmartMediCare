const { generateServiceToken } = require("./authService");
const { httpRequestWithRetry, CircuitBreaker, withCircuitBreaker } = require("../utils/failureHandler");

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || "http://localhost:5004";

const notificationServiceBreaker = new CircuitBreaker("notification-service", {
  failureThreshold: 5,
  resetTimeout: 30000
});

const NOTIFICATION_RETRY_CONFIG = {
  maxRetries: 2,
  retryDelay: 1000,
  timeout: 5000,
  backoffMultiplier: 2
};

const postNotification = async (endpoint, payload) => {
  const operation = async () => {
    const serviceToken = generateServiceToken();

    const response = await httpRequestWithRetry(
      {
        method: "POST",
        url: `${NOTIFICATION_SERVICE_URL}/api/notifications/${endpoint}`,
        data: payload,
        headers: {
          "Content-Type": "application/json",
          "X-Service-Token": serviceToken,
          "X-Service-Name": "appointment-service"
        }
      },
      NOTIFICATION_RETRY_CONFIG,
      "notification-service"
    );

    return response.data;
  };

  return withCircuitBreaker(notificationServiceBreaker, operation, {
    success: false,
    message: "Notification service unavailable"
  });
};

const sendAppointmentBookedNotification = async (payload) => postNotification("appointment-booked", payload);
const sendConsultationCompletedNotification = async (payload) => postNotification("consultation-completed", payload);
const getServiceHealth = () => notificationServiceBreaker.getState();

module.exports = {
  sendAppointmentBookedNotification,
  sendConsultationCompletedNotification,
  getServiceHealth
};
