const nodemailer = require('nodemailer');
const logger = require('./logger');

// Create Gmail transporter (simple and effective)
const createGmailTransporter = (user, pass) => {
  return nodemailer.createTransport({
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

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      // Only initialize if email credentials are provided
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        logger.warn('Email service not configured - SMTP credentials missing');
        return;
      }

      // Use simple Gmail configuration
      this.transporter = createGmailTransporter(process.env.SMTP_USER, process.env.SMTP_PASS);

      // Verify connection configuration
      this.transporter.verify((error, success) => {
        if (error) {
          logger.error('Email service configuration error:', error);
        } else {
          logger.info('Email service is ready to send messages');
        }
      });
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
    }
  }

  async sendEmail(to, subject, html, text = null) {
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
  }

  async sendRegistrationConfirmation(registration) {
    const subject = 'Registration Confirmation - MSME Clinic';
    const html = this.getRegistrationConfirmationTemplate(registration);
    
    return await this.sendEmail(registration.email, subject, html);
  }

  async sendContactNotification(contactMessage) {
    const subject = 'New Contact Form Submission - MSME Clinic';
    const html = this.getContactNotificationTemplate(contactMessage);
    
    // Send to admin email (you might want to add this to environment variables)
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
    return await this.sendEmail(adminEmail, subject, html);
  }

  async sendStatusUpdateNotification(registration, newStatus) {
    const subject = `Registration Status Update - MSME Clinic`;
    const html = this.getStatusUpdateTemplate(registration, newStatus);
    
    return await this.sendEmail(registration.email, subject, html);
  }

  async sendNewRegistrationAlert(registration) {
    const subject = 'New Registration Alert - MSME Clinic';
    const html = this.getNewRegistrationAlertTemplate(registration);
    
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
    return await this.sendEmail(adminEmail, subject, html);
  }

  getRegistrationConfirmationTemplate(registration) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Registration Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .highlight { background: #e8f4f8; padding: 15px; border-left: 4px solid #3498db; margin: 15px 0; }
          .success { background: #d4edda; padding: 15px; border-left: 4px solid #28a745; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Registration Confirmation</h1>
            <p>Katsina State National MSME Clinic</p>
          </div>
          <div class="content">
            <p>Dear ${registration.firstName} ${registration.lastName},</p>
            
            <p>Congratulations! Your registration for the Katsina State National MSME Clinic has been successfully received.</p>
            
            <div class="success">
              <h3>🎉 You're In! Registration Details:</h3>
              <p><strong>Registration ID:</strong> ${registration.registrationId}</p>
              <p><strong>Participant ID:</strong> ${registration.participantId}</p>
              <p><strong>Business Name:</strong> ${registration.businessName}</p>
              <p><strong>Business Type:</strong> ${registration.businessType}</p>
              <p><strong>Status:</strong> Confirmed to Attend</p>
            </div>
            
            <p>We will contact you soon with detailed information about the clinic schedule, venue and further details.</p>
            
            <p>Welcome to the Katsina State National MSME Clinic family! We look forward to supporting your business growth.</p>
            
            <p>If you have any questions, please don't hesitate to contact us.</p>
            
            <p>Best regards,<br>Katsina State National MSME Clinic Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getContactNotificationTemplate(contactMessage) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Contact Form Submission</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #e74c3c; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .message-box { background: white; padding: 15px; border: 1px solid #ddd; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Contact Form Submission</h1>
            <p>Katsina State National MSME Clinic</p>
          </div>
          <div class="content">
            <h3>Contact Details:</h3>
            <p><strong>Name:</strong> ${contactMessage.firstName} ${contactMessage.lastName}</p>
            <p><strong>Email:</strong> ${contactMessage.email}</p>
            <p><strong>Subject:</strong> ${contactMessage.subject}</p>
            <p><strong>Submitted:</strong> ${new Date(contactMessage.createdAt).toLocaleString()}</p>
            
            <div class="message-box">
              <h4>Message:</h4>
              <p>${contactMessage.message}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getStatusUpdateTemplate(registration, newStatus) {
    const statusMessages = {
      confirmed: 'Congratulations! Your registration has been confirmed.',
      rejected: 'Unfortunately, your registration has been rejected.',
      pending: 'Your registration is still under review.'
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Registration Status Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #27ae60; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .status-box { background: #e8f5e8; padding: 15px; border-left: 4px solid #27ae60; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Registration Status Update</h1>
          </div>
          <div class="content">
            <p>Dear ${registration.firstName} ${registration.lastName},</p>
            
            <div class="status-box">
              <h3>Status Update:</h3>
              <p><strong>New Status:</strong> ${newStatus.toUpperCase()}</p>
              <p>${statusMessages[newStatus] || 'Your registration status has been updated.'}</p>
            </div>
            
            <p><strong>Registration ID:</strong> ${registration.registrationId}</p>
            <p><strong>Business Name:</strong> ${registration.businessName}</p>
            
            <p>If you have any questions, please contact us.</p>
            
            <p>Best regards,<br>MSME Clinic Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getNewRegistrationAlertTemplate(registration) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Registration Alert</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3498db; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .alert-box { background: #d4edda; padding: 15px; border-left: 4px solid #28a745; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Registration Alert</h1>
            <p>Katsina State National MSME Clinic</p>
          </div>
          <div class="content">
            <div class="alert-box">
              <h3>🎉 New Registration Received</h3>
              <p>A new participant has successfully registered for the Katsina State National MSME Clinic.</p>
            </div>
            
            <h3>Registration Details:</h3>
            <p><strong>Name:</strong> ${registration.firstName} ${registration.lastName}</p>
            <p><strong>Email:</strong> ${registration.email}</p>
            <p><strong>Phone:</strong> ${registration.phone}</p>
            <p><strong>Business Name:</strong> ${registration.businessName}</p>
            <p><strong>Business Type:</strong> ${registration.businessType}</p>
            <p><strong>Registration ID:</strong> ${registration.registrationId}</p>
            <p><strong>Submitted:</strong> ${new Date(registration.createdAt).toLocaleString()}</p>
            
            <p>This participant is automatically confirmed to attend. You can view more details in the admin dashboard.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}

module.exports = new EmailService();