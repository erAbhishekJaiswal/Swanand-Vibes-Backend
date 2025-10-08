const nodemailer = require('nodemailer');

exports.sendOtpEmail = async (req, res) => {
  try {

    const transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com', // instead of IP
  // host: '204.11.59.88', // fallback to IP
  port: 465,
  secure: true,
  auth: {
    user: 'zeroseksolutions@zerosek.com',
    pass: 'AbhishekDivyesh@2003',
  },
  tls: {
    rejectUnauthorized: false
  },
  logger: true,
  debug: true
});

    const mailOptions = {
      from: '"Zerosek Solutions" <zeroseksolutions@zerosek.com>',
      to: 'aj478632@gmail.com',
      subject: 'Verify Your Email - OTP Inside',
      text: 'Verify Your Email - OTP Inside.',
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.error('❌ Error sending email:', error);
      }
      console.log('✅ Email sent:', info.response);
    });

    res.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('❌ Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
}