const nodemailer = require('nodemailer');
const logger = require('./logger');

// Create Gmail transporter (simple and effective)
const createGmailTransporter = (user, pass) => {
  return nodemailer.createTransporter({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: user,
      pass: pass
    }
  });
};

// Get all available Gmail accounts for fallback
const getEmailAccounts = () => {
  const accounts = [];
  
  // Primary Gmail account
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    accounts.push({
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      name: 'Primary Gmail'
    });
  }
  
  // Backup Gmail account 1 (if configured)
  if (process.env.SMTP_USER_2 && process.env.SMTP_PASS_2) {
    accounts.push({
      user: process.env.SMTP_USER_2,
      pass: process.env.SMTP_PASS_2,
      name: 'Backup Gmail 1'
    });
  }
  
  // Backup Gmail account 2 (if configured)
  if (process.env.SMTP_USER_3 && process.env.SMTP_PASS_3) {
    accounts.push({
      user: process.env.SMTP_USER_3,
      pass: process.env.SMTP_PASS_3,
      name: 'Backup Gmail 2'
    });
  }
  
  return accounts;
};

// Send email using Gmail SMTP with fallback accounts
const sendEmail = async (to, subject, html, text = null) => {
  const emailAccounts = getEmailAccounts();
  
  if (emailAccounts.length === 0) {
    logger.error('No email accounts configured');
    return { success: false, error: 'No email accounts configured' };
  }
  
  const mailOptions = {
    from: `"${process.env.FROM_NAME || 'Katsina State National MSME Clinic'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
    to: to,
    subject: subject,
    html: html,
    text: text || html.replace(/<[^>]*>/g, '') // Strip HTML for text version
  };

  // Try each Gmail account until one succeeds
  for (let i = 0; i < emailAccounts.length; i++) {
    const account = emailAccounts[i];
    logger.info(`📧 Trying ${account.name} (${account.user})...`);
    
    try {
      const transporter = createGmailTransporter(account.user, account.pass);
      const result = await transporter.sendMail(mailOptions);
      logger.info(`✅ Email sent successfully to ${to} using ${account.name}: ${result.messageId}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      logger.error(`❌ ${account.name} failed:`, error.message);
      
      // If this is the last account, return false
      if (i === emailAccounts.length - 1) {
        logger.error('All Gmail accounts failed');
        return { success: false, error: 'All Gmail accounts failed' };
      }
      
      // Continue to next account
      logger.info(`🔄 Trying next Gmail account...`);
    }
  }
  
  return { success: false, error: 'No working email accounts' };
};

// Send registration confirmation email
const sendRegistrationConfirmation = async (registration) => {
  const subject = 'Registration Confirmation - Katsina State National MSME Clinic';
  const html = getRegistrationConfirmationTemplate(registration);
  
  return await sendEmail(registration.email, subject, html);
};

// Send new registration alert to admin
const sendNewRegistrationAlert = async (registration) => {
  const subject = 'New Registration Alert - Katsina State National MSME Clinic';
  const html = getNewRegistrationAlertTemplate(registration);
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@msmeclinic.com';
  
  return await sendEmail(adminEmail, subject, html);
};

// Get registration confirmation email template
const getRegistrationConfirmationTemplate = (registration) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #2c3e50; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Registration Confirmation</h1>
        <p style="margin: 5px 0 0 0;">Katsina State National MSME Clinic</p>
      </div>
      <div style="padding: 20px; background: #f9f9f9;">
        <p>Dear ${registration.firstName} ${registration.lastName},</p>
        <p>Congratulations! Your registration for the Katsina State National MSME Clinic has been successfully received.</p>
        
        <div style="background: #d4edda; padding: 15px; border-left: 4px solid #28a745; margin: 15px 0;">
          <h3 style="margin: 0 0 10px 0; color: #155724;">🎉 You're In! Registration Details:</h3>
          <p style="margin: 5px 0;"><strong>Registration ID:</strong> ${registration.registrationId}</p>
          <p style="margin: 5px 0;"><strong>Participant ID:</strong> ${registration.participantId}</p>
          <p style="margin: 5px 0;"><strong>Business Name:</strong> ${registration.businessName}</p>
          <p style="margin: 5px 0;"><strong>Business Type:</strong> ${registration.businessType}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> Confirmed to Attend</p>
        </div>

        <p>We will contact you soon with detailed information about the clinic schedule, venue and further details.</p>
        <p>Welcome to the Katsina State National MSME Clinic family! We look forward to supporting your business growth.</p>
        <p>If you have any questions, please don't hesitate to contact us.</p>
        <p>Best regards,<br>Katsina State National MSME Clinic Team</p>
      </div>
      <div style="padding: 20px; text-align: center; font-size: 12px; color: #666;">
        <p>This is an automated message. Please do not reply to this email.</p>
      </div>
    </div>
  `;
};

// Get new registration alert email template
const getNewRegistrationAlertTemplate = (registration) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #2c3e50; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">New Registration Alert</h1>
        <p style="margin: 5px 0 0 0;">Katsina State National MSME Clinic</p>
      </div>
      <div style="padding: 20px; background: #f9f9f9;">
        <p>Dear Admin,</p>
        <p>A new participant has registered for the Katsina State National MSME Clinic.</p>
        
        <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 15px 0;">
          <h3 style="margin: 0 0 10px 0; color: #856404;">🔔 Registration Details:</h3>
          <p style="margin: 5px 0;"><strong>Name:</strong> ${registration.firstName} ${registration.lastName}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${registration.email}</p>
          <p style="margin: 5px 0;"><strong>Phone:</strong> ${registration.phone}</p>
          <p style="margin: 5px 0;"><strong>Business Name:</strong> ${registration.businessName}</p>
          <p style="margin: 5px 0;"><strong>Business Type:</strong> ${registration.businessType}</p>
          <p style="margin: 5px 0;"><strong>Registration ID:</strong> ${registration.registrationId}</p>
          <p style="margin: 5px 0;"><strong>Participant ID:</strong> ${registration.participantId}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> Confirmed to Attend</p>
        </div>

        <p>Please log in to the admin dashboard to view full details and manage registrations.</p>
        <p>Best regards,<br>Katsina State National MSME Clinic Team</p>
      </div>
      <div style="padding: 20px; text-align: center; font-size: 12px; color: #666;">
        <p>This is an automated message.</p>
      </div>
    </div>
  `;
};

module.exports = {
  sendEmail,
  sendRegistrationConfirmation,
  sendNewRegistrationAlert,
  getEmailAccounts
};
