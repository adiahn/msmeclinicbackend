const express = require('express');
const router = express.Router();
const emailService = require('../utils/emailService');
const logger = require('../utils/logger');

// GET /api/test-email - Test email service
router.get('/', async (req, res) => {
  try {
    logger.info('Testing email service...');
    
    // Check if email service is configured
    if (!emailService.transporter) {
      return res.status(500).json({
        success: false,
        error: 'Email service not configured - SMTP credentials missing'
      });
    }

    // Test email
    const testEmail = {
      to: 'test@example.com',
      subject: 'Test Email from MSME Clinic API',
      html: '<h1>Test Email</h1><p>This is a test email from the MSME Clinic API.</p>'
    };

    const result = await emailService.sendEmail(
      testEmail.to,
      testEmail.subject,
      testEmail.html
    );

    if (result.success) {
      res.json({
        success: true,
        message: 'Email service is working',
        data: {
          messageId: result.messageId,
          transporterConfigured: !!emailService.transporter,
          smtpHost: process.env.SMTP_HOST,
          smtpPort: process.env.SMTP_PORT,
          smtpUser: process.env.SMTP_USER ? 'configured' : 'missing',
          fromEmail: process.env.FROM_EMAIL
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Email sending failed',
        details: result.error
      });
    }
  } catch (error) {
    logger.error('Email test failed:', error);
    res.status(500).json({
      success: false,
      error: 'Email test failed',
      details: error.message
    });
  }
});

module.exports = router;
