const nodemailer = require('nodemailer');
const logger = require('./logger');

class CloudEmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        logger.warn('Cloud email service not configured - SMTP credentials missing');
        return;
      }

      // Alternative configuration for cloud platforms
      this.transporter = nodemailer.createTransporter({
        service: 'gmail', // Use service instead of host/port
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false
        },
        connectionTimeout: 60000, // 60 seconds
        greetingTimeout: 30000, // 30 seconds
        socketTimeout: 60000, // 60 seconds
        pool: false,
        maxConnections: 1,
        maxMessages: 1,
        rateDelta: 60000, // 1 minute
        rateLimit: 1, // 1 email per minute
        debug: false,
        logger: false
      });

      // Test connection
      this.transporter.verify((error, success) => {
        if (error) {
          logger.error('Cloud email service configuration error:', error);
        } else {
          logger.info('Cloud email service is ready');
        }
      });
    } catch (error) {
      logger.error('Failed to initialize cloud email service:', error);
    }
  }

  async sendEmail(to, subject, html, text = null, retries = 5) {
    try {
      if (!this.transporter) {
        logger.warn('Cloud email service not available');
        return { success: false, error: 'Cloud email service not configured' };
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

      // More aggressive retry logic for cloud platforms
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          logger.info(`Cloud email attempt ${attempt}/${retries} for ${to}`);
          
          const result = await this.transporter.sendMail(mailOptions);
          logger.info(`Cloud email sent successfully to ${to} (attempt ${attempt})`);
          return { success: true, messageId: result.messageId };
        } catch (error) {
          logger.warn(`Cloud email attempt ${attempt} failed:`, error.message);
          
          if (attempt === retries) {
            logger.error('All cloud email attempts failed:', error);
            return { success: false, error: error.message };
          }
          
          // Longer wait times for cloud platforms
          const waitTime = Math.pow(2, attempt) * 2000; // 4s, 8s, 16s, 32s
          logger.info(`Retrying cloud email in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    } catch (error) {
      logger.error('Cloud email service error:', error);
      return { success: false, error: error.message };
    }
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '');
  }
}

module.exports = new CloudEmailService();
