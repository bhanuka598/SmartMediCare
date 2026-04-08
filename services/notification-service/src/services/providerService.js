const nodemailer = require("nodemailer");

const hasSmtpCredentials = process.env.EMAIL_USER && process.env.EMAIL_PASS;

const transporter = hasSmtpCredentials
  ? nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: Number(process.env.EMAIL_PORT || 465),
      secure: String(process.env.EMAIL_SECURE || "true") === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 30000
    })
  : null;

const sendEmail = async ({ to, subject, html, text }) => {
  if (!to) {
    return { success: false, provider: "email", message: "Recipient email is required" };
  }

  if (!transporter) {
    console.log("[notification-service] Mock email sent", { to, subject, text });
    return {
      success: true,
      provider: "email",
      mode: "mock",
      messageId: `mock-email-${Date.now()}`
    };
  }

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    html,
    text
  });

  return {
    success: true,
    provider: "email",
    mode: "live",
    messageId: info?.messageId || null
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
