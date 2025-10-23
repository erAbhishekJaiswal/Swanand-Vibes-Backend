// emailService.js
// import brevo from "@getbrevo/brevo";

const brevo = require("@getbrevo/brevo");

const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

exports.sendEmail = async (toEmail, subject, content) => {
  const sendSmtpEmail = new brevo.SendSmtpEmail();

  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = content;
  sendSmtpEmail.sender = { name: "Your App", email: "swanandvibes@swanandvibes.com" };
  sendSmtpEmail.to = [{ email: toEmail }];

  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("Email sent:", data);
  } catch (err) {
    console.error("Error sending email:", err);
  }
}
