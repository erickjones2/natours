const nodemailer = require('nodemailer');

const sendEmail = async options => {
  // 1. Create a transporter
  const transporter = nodemailer.createTransport({
    // service: 'Gmail',  // If using Gmail, to avoid marking as spam, need to active "less secure app" option
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  // 2. Define the email options
  const mailOptions = {
    from: 'Duong Dinh <duongdinh@du.io>',
    to: options.email,
    subject: options.subject,
    text: options.message
    // html:
  };

  // 3. Actually send email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
