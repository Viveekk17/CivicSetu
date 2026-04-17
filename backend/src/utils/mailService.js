const nodemailer = require('nodemailer');

// Create transporter with more explicit settings
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  },
  debug: true,
  logger: true
});

/**
 * Send an email
 * @param {Object} options - { to, subject, html, attachments }
 */
const sendEmail = async (options) => {
  console.log(`📡 Attempting to send email to: ${options.to}`);
  try {
    const mailOptions = {
      from: `"CivicSetu Team" <${process.env.MAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments || []
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send Submission Received Email
 */
exports.sendSubmissionEmail = async (user, submission) => {
  if (!user.email) return;

  const subject = 'Submission Received - CivicSetu';
  
  // Format photos as attachments if they are local, otherwise just links in HTML
  const attachments = [];
  let photoHtml = '';

  if (submission.photos && submission.photos.length > 0) {
    submission.photos.forEach((photo, index) => {
      // If it's a Cloudinary URL, we can't easily attach it without downloading, 
      // so we'll just link it in HTML. If it's local, we could attach.
      // For now, let's just use <img> tags.
      photoHtml += `<div style="margin-bottom: 10px;">
        <img src="${photo.startsWith('http') ? photo : `${process.env.BASE_URL}${photo}`}" 
             alt="Submission Photo ${index + 1}" 
             style="max-width: 100%; border-radius: 8px; border: 1px solid #ddd;" />
      </div>`;
    });
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #0f172a 0%, #063a2e 100%); color: white; padding: 30px 20px; text-align: center;">
        <img src="https://civic-setu-woad.vercel.app/civicsetu-logo.png" alt="CivicSetu Logo" style="width: 80px; height: auto; margin-bottom: 15px;" />
        <h1 style="margin: 0; font-size: 24px;">CIVIC सेतु</h1>
        <p style="margin: 5px 0 0; opacity: 0.8;">Action Received | ID: ${submission.ticketId}</p>
      </div>
      <div style="padding: 30px; color: #333;">
        <h2 style="color: #063a2e;">Hello ${user.name},</h2>
        <p>Thank you for contributing to a cleaner Bharat! We have received your civic action submission and registered it as a ticket.</p>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; font-size: 16px;">Submission Summary:</h3>
          <p style="margin: 5px 0;"><strong>Ticket ID:</strong> ${submission.ticketId}</p>
          <p style="margin: 5px 0;"><strong>Type:</strong> ${submission.type}</p>
          <p style="margin: 5px 0;"><strong>Category:</strong> ${submission.verificationDetails?.category || 'General'}</p>
          <p style="margin: 5px 0;"><strong>Weight:</strong> ${submission.weight} kg</p>
          <p style="margin: 10px 0 0; font-style: italic; color: #666;">"${submission.description || 'No description provided'}"</p>
        </div>

        <h3 style="font-size: 16px;">Your submitted photos:</h3>
        ${photoHtml}

        <div style="margin-top: 30px; padding: 20px; background: #e6fffa; border-left: 4px solid #38b2ac; border-radius: 4px;">
          <p style="margin: 0; font-weight: bold; color: #2c7a7b;">What's Next?</p>
          <p style="margin: 10px 0 0; font-size: 14px;">Your ticket <strong>${submission.ticketId}</strong> will be reviewed by our admin team <strong>within 24 hours</strong>. Once approved, the corresponding credits will be automatically added to your account and you'll receive a follow-up email with the verdict.</p>
        </div>

        <p style="margin-top: 30px; font-size: 12px; color: #999; text-align: center;">
          Keep up the great work! Together we are building a cleaner future.<br>
          © 2026 CivicSetu Platform
        </p>
      </div>
    </div>
  `;

  return await sendEmail({ to: user.email, subject, html });
};

/**
 * Send Status Update Email
 */
exports.sendStatusUpdateEmail = async (user, submission) => {
  if (!user.email) return;

  const isApproved = submission.status === 'verified' || submission.status === 'approved';
  const subject = isApproved ? 'Submission Approved! ✅ - CivicSetu' : 'Submission Update - CivicSetu';

  // Schema uses perPersonCreditsAwarded / totalCreditsAwarded and weightKg —
  // fall back across legacy field names so older docs still render correctly.
  const creditsEarned = submission.perPersonCreditsAwarded
    ?? submission.totalCreditsAwarded
    ?? submission.creditsAwarded
    ?? 0;
  const weightKg = submission.weightKg ?? submission.weight ?? 0;
  const ticketId = submission.ticketId || '';
  const adminRemark = submission.verificationDetails?.notes;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
      <div style="background: ${isApproved ? 'linear-gradient(135deg, #065f46 0%, #059669 100%)' : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'}; color: white; padding: 30px 20px; text-align: center;">
        <img src="https://civic-setu-woad.vercel.app/civicsetu-logo.png" alt="CivicSetu Logo" style="width: 80px; height: auto; margin-bottom: 15px;" />
        <h1 style="margin: 0; font-size: 24px;">CIVIC सेतु</h1>
        <p style="margin: 5px 0 0; opacity: 0.8;">${isApproved ? 'Verification Successful' : 'Submission Status Updated'}</p>
        ${ticketId ? `<p style="margin: 8px 0 0; font-size: 12px; opacity: 0.75; letter-spacing: 1px;">Ticket ${ticketId}</p>` : ''}
      </div>
      <div style="padding: 30px; color: #333;">
        <h2 style="color: ${isApproved ? '#059669' : '#1e293b'};">Hello ${user.name},</h2>

        ${isApproved ? `
          <p>Great news! Your recent submission has been <strong>approved</strong> by the admin team.</p>
          <div style="text-align: center; padding: 30px; background: #f0fff4; border: 2px dashed #68d391; border-radius: 15px; margin: 25px 0;">
            <p style="margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #2f855a;">Credits Earned</p>
            <h1 style="margin: 10px 0; font-size: 48px; color: #276749;">${creditsEarned}</h1>
            <p style="margin: 0; color: #2f855a;">Coins have been added to your balance!</p>
          </div>
          <p>This contribution helped save <strong>${Number(weightKg).toFixed(1)} kg</strong> of pollution. Keep going!</p>
          ${adminRemark ? `
            <div style="background: #f0fdf4; padding: 16px 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
              <p style="margin: 0 0 6px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #047857;">Admin Remark</p>
              <p style="margin: 0; color: #1f2937;">${adminRemark}</p>
            </div>
          ` : ''}
        ` : `
          <p>Your submission status has been updated. Unfortunately, it could not be verified at this time.</p>
          <div style="background: #fff5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f56565;">
            <p style="margin: 0;"><strong>Reason / Admin Remark:</strong> ${adminRemark || 'No specific notes provided.'}</p>
          </div>
          <p>You can try submitting again with more clear photos or following the guidelines in the About section.</p>
        `}

        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL}/my-tickets" 
             style="display: inline-block; padding: 12px 25px; background: #0f172a; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
             Visit Dashboard
          </a>
        </div>

        <p style="margin-top: 40px; font-size: 12px; color: #999; text-align: center;">
          Thank you for being a part of CivicSetu.<br>
          © 2026 CivicSetu Platform
        </p>
      </div>
    </div>
  `;

  return await sendEmail({ to: user.email, subject, html });
};
/**
 * Send OTP Verification Email
 */
exports.sendOTPEmail = async (email, otp) => {
  const subject = `${otp} is your CivicSetu verification code`;

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1a2f5a 100%); color: white; padding: 40px 20px; text-align: center;">
        <img src="https://civic-setu-woad.vercel.app/civicsetu-logo.png" alt="CivicSetu Logo" style="width: 80px; height: auto; margin-bottom: 20px;" />
        <h1 style="margin: 0; font-size: 28px; letter-spacing: 2px;">CIVIC सेतु</h1>
        <p style="margin: 10px 0 0; opacity: 0.8; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Email Verification</p>
      </div>
      
      <div style="padding: 40px 30px; color: #1e293b; line-height: 1.6;">
        <h2 style="margin-top: 0; color: #0f172a; font-size: 20px;">Verify your email</h2>
        <p style="margin-bottom: 25px;">Thank you for joining CivicSetu! Use the verification code below to complete your registration. This code will expire in <strong>5 minutes</strong>.</p>
        
        <div style="background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 25px; text-align: center; margin: 30px 0;">
          <h1 style="margin: 0; font-size: 42px; letter-spacing: 8px; color: #3b82f6; font-family: monospace;">${otp}</h1>
        </div>
        
        <p style="font-size: 14px; color: #64748b; text-align: center;">If you didn't request this code, you can safely ignore this email.</p>
      </div>
      
      <div style="background: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 12px; color: #94a3b8;">
          © 2026 CivicSetu Platform • Built for Bharat<br>
          Turning clean actions into collective impact.
        </p>
      </div>
    </div>
  `;

  return await sendEmail({ to: email, subject, html });
};

/**
 * Send Ticket Confirmation Email
 */
exports.sendTicketConfirmationEmail = async (user, ticket) => {
    if (!user.email) return;

    const subject = `Ticket Registered: ${ticket.ticketId} - CivicSetu Helpdesk`;

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 30px 20px; text-align: center;">
        <img src="https://civic-setu-woad.vercel.app/civicsetu-logo.png" alt="CivicSetu Logo" style="width: 80px; height: auto; margin-bottom: 15px;" />
        <h1 style="margin: 0; font-size: 24px;">CIVIC सेतु Helpdesk</h1>
        <p style="margin: 5px 0 0; opacity: 0.8;">Ticket Confirmation</p>
      </div>
      <div style="padding: 30px; color: #333;">
        <h2 style="color: #1e293b;">Hello ${user.name},</h2>
        <p>Your support ticket has been successfully registered. Our team will review your request and provide an update shortly.</p>
        
        <div style="background: #f8fafc; padding: 25px; border-radius: 12px; margin: 25px 0; border: 1px solid #e2e8f0; text-align: center;">
          <p style="margin: 0; font-size: 14px; color: #64748b; text-transform: uppercase;">Your Ticket ID</p>
          <h1 style="margin: 10px 0; font-size: 32px; color: #2563eb; font-family: monospace;">${ticket.ticketId}</h1>
          <div style="display: inline-block; padding: 4px 12px; background: #dbeafe; color: #1e40af; border-radius: 99px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
            Status: ${ticket.status}
          </div>
        </div>

        <div style="background: #ffffff; padding: 20px; border: 1px solid #f1f5f9; border-radius: 8px;">
          <h3 style="margin-top: 0; font-size: 16px; color: #475569;">Issue Details:</h3>
          <p style="margin: 5px 0;"><strong>Category:</strong> ${ticket.category}</p>
          <p style="margin: 5px 0;"><strong>Type:</strong> ${ticket.type.replace(/_/g, ' ')}</p>
          <p style="margin: 15px 0 0; color: #334155; line-height: 1.5;">"${ticket.message}"</p>
        </div>

        <div style="margin-top: 30px; padding: 20px; background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 4px;">
          <p style="margin: 0; font-weight: bold; color: #92400e;">Note:</p>
          <p style="margin: 10px 0 0; font-size: 14px;">You can track the status of this ticket in your dashboard or by asking our AI chatbot using your Ticket ID.</p>
        </div>

        <div style="text-align: center; margin-top: 35px;">
          <a href="${process.env.FRONTEND_URL || 'https://civic-setu-woad.vercel.app'}/my-tickets/${ticket.ticketId}"
             style="display: inline-block; padding: 12px 30px; background: #14248a; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; transition: background 0.2s;">
             Track this ticket
          </a>
          <p style="margin: 12px 0 0; font-size: 12px; color: #94a3b8;">
            Or open <a href="${process.env.FRONTEND_URL || 'https://civic-setu-woad.vercel.app'}/my-tickets" style="color: #2563eb; text-decoration: none;">all your tickets</a>.
          </p>
        </div>

        <p style="margin-top: 40px; font-size: 12px; color: #94a3b8; text-align: center;">
          Thank you for helping us improve.<br>
          © 2026 CivicSetu Support Team
        </p>
      </div>
    </div>
  `;

    return await sendEmail({ to: user.email, subject, html });
};
