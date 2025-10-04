const nodemailer = require('nodemailer');
const logger = require('./logger');

class RenderEmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        logger.warn('Render email service not configured - SMTP credentials missing');
        return;
      }

      // Use a different approach for Render - try multiple configurations
      const configs = [
        // Configuration 1: Gmail with different port
        {
          service: 'gmail',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
          tls: {
            rejectUnauthorized: false
          },
          connectionTimeout: 10000,
          greetingTimeout: 5000,
          socketTimeout: 10000
        },
        // Configuration 2: Direct SMTP with port 465 (SSL)
        {
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
          tls: {
            rejectUnauthorized: false
          },
          connectionTimeout: 10000,
          greetingTimeout: 5000,
          socketTimeout: 10000
        },
        // Configuration 3: SMTP with port 25 (if allowed)
        {
          host: 'smtp.gmail.com',
          port: 25,
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
          tls: {
            rejectUnauthorized: false
          },
          connectionTimeout: 10000,
          greetingTimeout: 5000,
          socketTimeout: 10000
        }
      ];

      // Try each configuration until one works
      this.tryConfigurations(configs);
    } catch (error) {
      logger.error('Failed to initialize render email service:', error);
    }
  }

  async tryConfigurations(configs) {
    for (let i = 0; i < configs.length; i++) {
      try {
        logger.info(`Trying email configuration ${i + 1}/${configs.length}`);
        
        const testTransporter = nodemailer.createTransporter(configs[i]);
        
        // Test the configuration
        await new Promise((resolve, reject) => {
          testTransporter.verify((error, success) => {
            if (error) {
              logger.warn(`Configuration ${i + 1} failed:`, error.message);
              reject(error);
            } else {
              logger.info(`Configuration ${i + 1} successful!`);
              this.transporter = testTransporter;
              resolve(success);
            }
          });
        });
        
        // If we get here, the configuration worked
        break;
      } catch (error) {
        logger.warn(`Configuration ${i + 1} failed:`, error.message);
        if (i === configs.length - 1) {
          logger.error('All email configurations failed');
        }
      }
    }
  }

  async sendEmail(to, subject, html, text = null) {
    try {
      if (!this.transporter) {
        logger.warn('Render email service not available - skipping email send');
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

      logger.info(`Attempting to send email to ${to} using render email service`);
      
      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Render email sent successfully to ${to}:`, result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      logger.error('Render email service failed:', error);
      return { success: false, error: error.message };
    }
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '');
  }
}

module.exports = new RenderEmailService();
