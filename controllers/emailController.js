const nodemailer = require('nodemailer');
const Order = require('../models/Order');
const User = require('../models/User');
const Wallet = require('../models/Wallet');




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



    // const transporter = nodemailer.createTransport({
    //   host: 'smtp.gyaat.in',         // ✅ use domain, not IP
    //   port: 465,                     // ✅ SSL port
    //   secure: true,                  // ✅ SSL/TLS
    //   auth: {
    //     user: 'abhishek.jaiswal@gyaat.in',   // ✅ your full email address
    //     pass: '@asbhshek123',    // ❗ use the exact password you set in cPanel
    //   },
    //   logger: true,   // ✅ Enable logs
    //   debug: true     // ✅ Enable debug output
    // });

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






    //   const { email, visitedPages } = req.body;

    //   const transporter = nodemailer.createTransport({
    //     host: '204.11.59.88',
    //     port: 465,
    //     secure: true,
    //     auth: {
    //       user: 'abhishek.jaiswal@gyaat.in',
    //       pass: '@asbhshek123',
    //     },
    //       tls: {
    //   rejectUnauthorized: false, // ⚠️ insecure, only for testing
    // },
    //   });

    //   const mailOptions = {
    //     from: '"Gyaat Visit Report" <abhishek.jaiswal@gyaat.in>',
    //     to: email,
    //     subject: 'Your Visit Record',
    //     text: `You visited these pages:\n\n${visitedPages.map(p => `- ${p}`).join('\n')}`,
    //     html: `
    //       <h3>Your Visit Record</h3>
    //       <ul>${visitedPages.map(page => `<li>${page}</li>`).join('')}</ul>
    //       <p>Thanks for visiting!</p>
    //     `,
    //   };

    //   await transporter.sendMail(mailOptions);
    //   res.status(200).json({ message: 'Email sent successfully' });

  } catch (error) {
    console.error('❌ Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
}