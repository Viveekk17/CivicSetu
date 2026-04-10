const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('Using Email:', process.env.MAIL_USER);
console.log('App Password length:', process.env.MAIL_PASS?.length);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

async function testEmail() {
  try {
    console.log('Attempting to send test email...');
    const info = await transporter.sendMail({
      from: `"CivicSetu Test" <${process.env.MAIL_USER}>`,
      to: process.env.MAIL_USER, // Send to self
      subject: 'CivicSetu SMTP Test',
      text: 'If you receive this, SMTP is working correctly!',
      html: '<b>If you receive this, SMTP is working correctly!</b>'
    });

    console.log('🎉 Email sent successfully!');
    console.log('Message ID:', info.messageId);
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to send email:');
    console.error(err);
    process.exit(1);
  }
}

testEmail();
