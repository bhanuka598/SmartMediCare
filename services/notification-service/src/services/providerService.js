const buildResendPayload = ({ to, subject, html, text }) => ({
  from: process.env.EMAIL_FROM || "no-reply@smartmedicare.local",
  to: Array.isArray(to) ? to : [to],
  subject,
  html,
  text
});

const sendEmail = async ({ to, subject, html, text }) => {
  if (!to) {
    return { success: false, provider: "email", message: "Recipient email is required" };
  }

  if (!process.env.RESEND_API_KEY) {
    console.log("[notification-service] Mock email sent", { to, subject, text });
    return {
      success: true,
      provider: "email",
      mode: "mock",
      messageId: `mock-email-${Date.now()}`
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(buildResendPayload({ to, subject, html, text }))
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      success: false,
      provider: "email",
      message: data?.message || "Email provider request failed",
      error: data
    };
  }

  return {
    success: true,
    provider: "email",
    mode: "live",
    messageId: data?.id || null
  };
};

const sendSms = async ({ to, body }) => {
  if (!to) {
    return { success: false, provider: "sms", message: "Recipient phone number is required" };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromPhone) {
    console.log("[notification-service] Mock SMS sent", { to, body });
    return {
      success: true,
      provider: "sms",
      mode: "mock",
      messageId: `mock-sms-${Date.now()}`
    };
  }

  const encoded = new URLSearchParams({
    To: to,
    From: fromPhone,
    Body: body
  });

  const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${authHeader}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: encoded.toString()
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      success: false,
      provider: "sms",
      message: data?.message || "SMS provider request failed",
      error: data
    };
  }

  return {
    success: true,
    provider: "sms",
    mode: "live",
    messageId: data?.sid || null
  };
};

module.exports = {
  sendEmail,
  sendSms
};
