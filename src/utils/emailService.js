const nodemailer = require('nodemailer');
const logger = require('./logger');

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

      // Use different configuration for production (Render) vs development
      const isProduction = process.env.NODE_ENV === 'production';
      
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false,
          ciphers: 'SSLv3'
        },
        connectionTimeout: isProduction ? 15000 : 10000, // Longer timeout for production
        greetingTimeout: isProduction ? 10000 : 5000,
        socketTimeout: isProduction ? 15000 : 10000,
        pool: isProduction, // Use pooling in production
        maxConnections: isProduction ? 3 : 1, // Fewer connections in production
        maxMessages: isProduction ? 50 : 100,
        rateDelta: isProduction ? 30000 : 20000, // Slower rate in production
        rateLimit: isProduction ? 3 : 5, // Fewer emails per rateDelta in production
        debug: !isProduction, // Debug only in development
        logger: isProduction ? false : true
      });

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

  async sendEmail(to, subject, html, text = null, retries = 3) {
    try {
      if (!this.transporter) {
        logger.warn('Email service not available - skipping email send');
        return { success: false, error: 'Email service not configured' };
      }

      const mailOptions = {
        from: {
          name: process.env.FROM_NAME || 'Katsina State National MSME Clinic',
          address: process.env.FROM_EMAIL || process.env.SMTP_USER
        },
        to,
        subject,
        html,
        text: text || this.stripHtml(html)
      };

      // Retry logic for email sending
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const result = await this.transporter.sendMail(mailOptions);
          logger.info(`Email sent successfully to ${to} (attempt ${attempt}):`, result.messageId);
          return { success: true, messageId: result.messageId };
        } catch (error) {
          logger.warn(`Email send attempt ${attempt} failed:`, error.message);
          
          if (attempt === retries) {
            logger.error('All email send attempts failed:', error);
            return { success: false, error: error.message };
          }
          
          // Wait before retry (exponential backoff)
          const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          logger.info(`Retrying email send in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    } catch (error) {
      logger.error('Failed to send email:', error);
      return { success: false, error: error.message };
    }
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