const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Email templates
const emailTemplates = {
  welcome: (name, role) => ({
    subject: 'Welcome to Job Portal!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Job Portal</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Hello ${name}!</h2>
          <p style="color: #666; line-height: 1.6;">
            Thank you for joining Job Portal as a ${role}. We're excited to have you on board!
          </p>
          ${role === 'jobseeker' ? `
            <p style="color: #666; line-height: 1.6;">
              You can now:
            </p>
            <ul style="color: #666; line-height: 1.6;">
              <li>Browse thousands of job opportunities</li>
              <li>Apply to jobs with one click</li>
              <li>Save jobs for later</li>
              <li>Get personalized job recommendations</li>
            </ul>
          ` : role === 'employer' ? `
            <p style="color: #666; line-height: 1.6;">
              You can now:
            </p>
            <ul style="color: #666; line-height: 1.6;">
              <li>Post job openings</li>
              <li>Manage applications</li>
              <li>Search for candidates</li>
              <li>Track job performance</li>
            </ul>
          ` : ''}
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/dashboard" 
               style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Go to Dashboard
            </a>
          </div>
          <p style="color: #999; font-size: 14px; text-align: center;">
            If you have any questions, feel free to contact our support team.
          </p>
        </div>
      </div>
    `
  }),

  jobApplication: (applicantName, jobTitle, companyName) => ({
    subject: `New Application for ${jobTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #28a745; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">New Job Application</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Hello ${companyName},</h2>
          <p style="color: #666; line-height: 1.6;">
            You have received a new application for the position: <strong>${jobTitle}</strong>
          </p>
          <p style="color: #666; line-height: 1.6;">
            Applicant: <strong>${applicantName}</strong>
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/employer/applications" 
               style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Application
            </a>
          </div>
        </div>
      </div>
    `
  }),

  applicationStatusUpdate: (applicantName, jobTitle, status, companyName) => ({
    subject: `Application Status Update: ${jobTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: ${getStatusColor(status)}; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Application Update</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Hello ${applicantName},</h2>
          <p style="color: #666; line-height: 1.6;">
            Your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been updated.
          </p>
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${getStatusColor(status)};">
            <p style="margin: 0; color: #333;">
              <strong>Status:</strong> ${formatStatus(status)}
            </p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/applications" 
               style="background: ${getStatusColor(status)}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Applications
            </a>
          </div>
        </div>
      </div>
    `
  }),

  interviewScheduled: (applicantName, jobTitle, companyName, interviewDetails) => ({
    subject: `Interview Scheduled: ${jobTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #007bff; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Interview Scheduled</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Hello ${applicantName},</h2>
          <p style="color: #666; line-height: 1.6;">
            Great news! An interview has been scheduled for your application to <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.
          </p>
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Interview Details:</h3>
            <p style="margin: 5px 0; color: #666;"><strong>Date & Time:</strong> ${new Date(interviewDetails.dateTime).toLocaleString()}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Mode:</strong> ${interviewDetails.mode}</p>
            ${interviewDetails.location ? `<p style="margin: 5px 0; color: #666;"><strong>Location:</strong> ${interviewDetails.location}</p>` : ''}
            ${interviewDetails.meetingLink ? `<p style="margin: 5px 0; color: #666;"><strong>Meeting Link:</strong> <a href="${interviewDetails.meetingLink}">${interviewDetails.meetingLink}</a></p>` : ''}
          </div>
          <p style="color: #666; line-height: 1.6;">
            Please make sure to be prepared and on time. Good luck!
          </p>
        </div>
      </div>
    `
  }),

  jobApproved: (companyName, jobTitle) => ({
    subject: `Job Approved: ${jobTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #28a745; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Job Approved</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Hello ${companyName},</h2>
          <p style="color: #666; line-height: 1.6;">
            Your job posting "<strong>${jobTitle}</strong>" has been approved and is now live on our platform.
          </p>
          <p style="color: #666; line-height: 1.6;">
            Candidates can now view and apply to your job opening. You'll receive notifications as applications come in.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/employer/jobs" 
               style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Job Posting
            </a>
          </div>
        </div>
      </div>
    `
  }),

  jobRejected: (companyName, jobTitle, reason) => ({
    subject: `Job Rejected: ${jobTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #dc3545; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Job Rejected</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Hello ${companyName},</h2>
          <p style="color: #666; line-height: 1.6;">
            Unfortunately, your job posting "<strong>${jobTitle}</strong>" has been rejected.
          </p>
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <p style="margin: 0; color: #333;">
              <strong>Reason:</strong> ${reason}
            </p>
          </div>
          <p style="color: #666; line-height: 1.6;">
            Please review the feedback and feel free to resubmit with the necessary changes.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/employer/jobs" 
               style="background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Jobs
            </a>
          </div>
        </div>
      </div>
    `
  })
};

// Helper functions
function getStatusColor(status) {
  const colors = {
    applied: '#007bff',
    reviewed: '#6f42c1',
    shortlisted: '#fd7e14',
    interviewed: '#20c997',
    selected: '#28a745',
    rejected: '#dc3545'
  };
  return colors[status] || '#6c757d';
}

function formatStatus(status) {
  const formatted = {
    applied: 'Application Received',
    reviewed: 'Under Review',
    shortlisted: 'Shortlisted',
    interviewed: 'Interviewed',
    selected: 'Selected',
    rejected: 'Not Selected'
  };
  return formatted[status] || status;
}

// Main email sending function
const sendEmail = async (to, template, data) => {
  try {
    const transporter = createTransporter();
    const emailContent = emailTemplates[template](
      ...(Array.isArray(data) ? data : [data])
    );

    const mailOptions = {
      from: `"Job Portal" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: emailContent.subject,
      html: emailContent.html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Specific email functions
const sendWelcomeEmail = async (email, name, role) => {
  return await sendEmail(email, 'welcome', [name, role]);
};

const sendJobApplicationEmail = async (employerEmail, applicantName, jobTitle, companyName) => {
  return await sendEmail(employerEmail, 'jobApplication', [applicantName, jobTitle, companyName]);
};

const sendApplicationStatusEmail = async (applicantEmail, applicantName, jobTitle, status, companyName) => {
  return await sendEmail(applicantEmail, 'applicationStatusUpdate', [applicantName, jobTitle, status, companyName]);
};

const sendInterviewScheduledEmail = async (applicantEmail, applicantName, jobTitle, companyName, interviewDetails) => {
  return await sendEmail(applicantEmail, 'interviewScheduled', [applicantName, jobTitle, companyName, interviewDetails]);
};

const sendJobApprovedEmail = async (employerEmail, companyName, jobTitle) => {
  return await sendEmail(employerEmail, 'jobApproved', [companyName, jobTitle]);
};

const sendJobRejectedEmail = async (employerEmail, companyName, jobTitle, reason) => {
  return await sendEmail(employerEmail, 'jobRejected', [companyName, jobTitle, reason]);
};

// Bulk email function for notifications
const sendBulkEmail = async (recipients, template, data) => {
  const results = [];
  
  for (const recipient of recipients) {
    try {
      const result = await sendEmail(recipient, template, data);
      results.push({ email: recipient, ...result });
    } catch (error) {
      results.push({ email: recipient, success: false, error: error.message });
    }
  }
  
  return results;
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendJobApplicationEmail,
  sendApplicationStatusEmail,
  sendInterviewScheduledEmail,
  sendJobApprovedEmail,
  sendJobRejectedEmail,
  sendBulkEmail
};