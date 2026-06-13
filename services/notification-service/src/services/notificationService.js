const { sendEmail, sendSms } = require("./providerService");
const {
  buildAppointmentBookedNotifications,
  buildConsultationCompletedNotifications,
  buildPaymentReceivedNotifications,
  buildPaymentRefundedNotifications,
  buildRefundPayoutPaidNotifications
} = require("./templateService");

const dispatchNotification = async (notification) => {
  const results = [];

  if (notification.email) {
    results.push(await sendEmail({
      to: notification.email,
      subject: notification.subject,
      html: notification.html,
      text: notification.text
    }));
  } else {
    results.push({ success: false, provider: "email", message: "No email recipient available" });
  }

  if (notification.phone) {
    results.push(await sendSms({
      to: notification.phone,
      body: notification.text
    }));
  } else {
    results.push({ success: false, provider: "sms", message: "No phone recipient available" });
  }

  return {
    recipient: notification.recipient,
    channels: results
  };
};

const notifyAppointmentBooked = async (payload) => {
  const notifications = buildAppointmentBookedNotifications(payload);
  return Promise.all(notifications.map(dispatchNotification));
};

const notifyConsultationCompleted = async (payload) => {
  const notifications = buildConsultationCompletedNotifications(payload);
  return Promise.all(notifications.map(dispatchNotification));
};

const notifyPaymentReceived = async (payload) => {
  const notifications = buildPaymentReceivedNotifications(payload);
  return Promise.all(notifications.map(dispatchNotification));
};

const notifyPaymentRefunded = async (payload) => {
  const notifications = buildPaymentRefundedNotifications(payload);
  return Promise.all(notifications.map(dispatchNotification));
};

const notifyRefundPayoutPaid = async (payload) => {
  const notifications = buildRefundPayoutPaidNotifications(payload);
  return Promise.all(notifications.map(dispatchNotification));
};

module.exports = {
  notifyAppointmentBooked,
  notifyConsultationCompleted,
  notifyPaymentReceived,
  notifyPaymentRefunded,
  notifyRefundPayoutPaid
};
