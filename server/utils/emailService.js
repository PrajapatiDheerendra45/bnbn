const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Email templates
const emailTemplates = {
  welcome: (name) => ({
    subject: 'Welcome to Job Portal!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to Job Portal!</h2>
        <p>Hello ${name},</p>
        <p>Thank you for registering with Job Portal. We're excited to have you on board!</p>
        <p>You can now:</p>
        <ul>
          <li>Browse and search for jobs</li>
          <li>Apply to positions that match your skills</li>
          <li>Track your applications</li>
          <li>Update your profile</li>
        </ul>
        <p>Best regards,<br>The Job Portal Team</p>
      </div>
    `
  }),

  jobApplication: (jobTitle, companyName) => ({
    subject: 'Job Application Submitted Successfully',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Application Submitted!</h2>
        <p>Your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been submitted successfully.</p>
        <p>We'll notify you when the employer reviews your application.</p>
        <p>Good luck!</p>
        <p>Best regards,<br>The Job Portal Team</p>
      </div>
    `
  }),

  newApplication: (jobTitle, applicantName) => ({
    subject: 'New Job Application Received',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Application Received</h2>
        <p>You have received a new application for <strong>${jobTitle}</strong> from <strong>${applicantName}</strong>.</p>
        <p>Please log in to your dashboard to review the application.</p>
        <p>Best regards,<br>The Job Portal Team</p>
      </div>
    `
  }),

  jobApproved: (jobTitle) => ({
    subject: 'Job Post Approved',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Job Post Approved!</h2>
        <p>Your job post "<strong>${jobTitle}</strong>" has been approved and is now live on our platform.</p>
        <p>You can track applications and manage your job post from your employer dashboard.</p>
        <p>Best regards,<br>The Job Portal Team</p>
      </div>
    `
  }),

  jobRejected: (jobTitle, reason) => ({
    subject: 'Job Post Not Approved',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Job Post Update</h2>
        <p>Your job post "<strong>${jobTitle}</strong>" was not approved.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>Please review and update your job post accordingly.</p>
        <p>Best regards,<br>The Job Portal Team</p>
      </div>
    `
  }),

  applicationStatus: (jobTitle, status) => ({
    subject: `Application Status Update - ${status}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Application Status Update</h2>
        <p>Your application for <strong>${jobTitle}</strong> has been updated.</p>
        <p><strong>New Status:</strong> ${status}</p>
        <p>Please log in to your dashboard for more details.</p>
        <p>Best regards,<br>The Job Portal Team</p>
      </div>
    `
  }),

  passwordReset: (resetLink) => ({
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Password Reset Request</h2>
        <p>You requested a password reset for your Job Portal account.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        <p>If you didn't request this, please ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
        <p>Best regards,<br>The Job Portal Team</p>
      </div>
    `
  })
};

// Send email function
const sendEmail = async (to, template, data = {}) => {
  try {
    const transporter = createTransporter();
    const emailTemplate = emailTemplates[template](data);
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: to,
      subject: emailTemplate.subject,
      html: emailTemplate.html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Send welcome email
const sendWelcomeEmail = async (email, name) => {
  return await sendEmail(email, 'welcome', name);
};

// Send job application confirmation
const sendApplicationConfirmation = async (email, jobTitle, companyName) => {
  return await sendEmail(email, 'jobApplication', { jobTitle, companyName });
};

// Send new application notification to employer
const sendNewApplicationNotification = async (email, jobTitle, applicantName) => {
  return await sendEmail(email, 'newApplication', { jobTitle, applicantName });
};

// Send job approval notification
const sendJobApprovalNotification = async (email, jobTitle) => {
  return await sendEmail(email, 'jobApproved', jobTitle);
};

// Send job rejection notification
const sendJobRejectionNotification = async (email, jobTitle, reason) => {
  return await sendEmail(email, 'jobRejected', { jobTitle, reason });
};

// Send application status update
const sendApplicationStatusUpdate = async (email, jobTitle, status) => {
  return await sendEmail(email, 'applicationStatus', { jobTitle, status });
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetLink) => {
  return await sendEmail(email, 'passwordReset', resetLink);
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendApplicationConfirmation,
  sendNewApplicationNotification,
  sendJobApprovalNotification,
  sendJobRejectionNotification,
  sendApplicationStatusUpdate,
  sendPasswordResetEmail
};