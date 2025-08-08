const nodemailer = require("nodemailer");
const config = require("../config");

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure, // true for 465, false for other ports
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

async function sendMail({ to, subject, html }) {
  return transporter.sendMail({
    from: config.email.from,
    to,
    subject,
    html,
  });
}

module.exports = { sendMail };
