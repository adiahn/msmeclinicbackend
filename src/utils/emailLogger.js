const logger = require('./logger');
const fs = require('fs');
const path = require('path');

class EmailLogger {
  constructor() {
    this.logFile = path.join(__dirname, '../../logs/emails.log');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  async logEmail(to, subject, html, type = 'email') {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      type,
      to,
      subject,
      html: html.substring(0, 500) + '...', // Truncate HTML for logging
      status: 'logged'
    };

    try {
      // Log to console
      logger.info(`📧 EMAIL LOGGED: ${type} to ${to} - ${subject}`);
      
      // Log to file
      const logLine = JSON.stringify(logEntry) + '\n';
      fs.appendFileSync(this.logFile, logLine);
      
      return { success: true, messageId: `log-${Date.now()}` };
    } catch (error) {
      logger.error('Failed to log email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendRegistrationConfirmation(registration) {
    const subject = 'Registration Confirmation - Katsina State National MSME Clinic';
    const html = this.getRegistrationConfirmationTemplate(registration);
    
    return await this.logEmail(registration.email, subject, html, 'registration_confirmation');
  }

  async sendNewRegistrationAlert(registration) {
    const subject = 'New Registration Alert - Katsina State National MSME Clinic';
    const html = this.getNewRegistrationAlertTemplate(registration);
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@msmeclinic.com';
    
    return await this.logEmail(adminEmail, subject, html, 'admin_alert');
  }

  getRegistrationConfirmationTemplate(registration) {
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
  }

  getNewRegistrationAlertTemplate(registration) {
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
  }

  // Get all logged emails
  getLoggedEmails() {
    try {
      if (!fs.existsSync(this.logFile)) {
        return [];
      }
      
      const content = fs.readFileSync(this.logFile, 'utf8');
      return content.split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line));
    } catch (error) {
      logger.error('Failed to read email logs:', error);
      return [];
    }
  }
}

module.exports = new EmailLogger();
