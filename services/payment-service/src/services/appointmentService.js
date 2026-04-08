const jwt = require("jsonwebtoken");

const APPOINTMENT_SERVICE_URL = process.env.APPOINTMENT_SERVICE_URL || "http://localhost:5001";
const INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET || "secret";

const generateServiceToken = () =>
  jwt.sign({ service: "payment-service" }, INTERNAL_SERVICE_SECRET, { expiresIn: "1h" });

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
};

const getAppointmentPaymentContext = async (appointmentId) => {
  const serviceToken = generateServiceToken();
  const data = await fetchJson(`${APPOINTMENT_SERVICE_URL}/api/appointments/internal/${appointmentId}/payment-context`, {
    method: "GET",
    headers: {
      "X-Service-Token": serviceToken,
      "X-Service-Name": "payment-service"
    }
  });

  return data.data;
};

const updateAppointmentPaymentStatus = async (appointmentId, payload) => {
  const serviceToken = generateServiceToken();
  const data = await fetchJson(`${APPOINTMENT_SERVICE_URL}/api/appointments/internal/${appointmentId}/payment-status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "X-Service-Token": serviceToken,
      "X-Service-Name": "payment-service"
    },
    body: JSON.stringify(payload)
  });

  return data.data;
};

module.exports = {
  getAppointmentPaymentContext,
  updateAppointmentPaymentStatus
};
