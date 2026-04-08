const { sendEmail, sendSms } = require("./providerService");
const {
  buildAppointmentBookedNotifications,
  buildConsultationCompletedNotifications
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

module.exports = {
  notifyAppointmentBooked,
  notifyConsultationCompleted
};
