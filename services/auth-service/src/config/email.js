const nodemailer = require('nodemailer');

// Check if email credentials are configured
const hasEmailCredentials = process.env.EMAIL_USER && process.env.EMAIL_PASS;

let transporter;

if (hasEmailCredentials) {
  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
} else {
  // Create a mock transporter for development
  transporter = {
    sendMail: async (mailOptions) => {
      console.log('=== MOCK EMAIL ===');
      console.log('To:', mailOptions.to);
      console.log('Subject:', mailOptions.subject);
      console.log('Text:', mailOptions.text);
      console.log('==================');
      return { messageId: 'mock-' + Date.now() };
    }
  };
}

module.exports = transporter;