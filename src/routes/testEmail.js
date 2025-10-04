const express = require('express');
const router = express.Router();
const emailService = require('../utils/emailService');
const logger = require('../utils/logger');

// GET /api/test-email - Test email service
router.get('/', async (req, res) => {
  try {
    logger.info('Testing simple email service...');
    
    // Check if email service is configured
    if (!emailService.transporter) {
      return res.status(500).json({
        success: false,
        error: 'Email service not configured - SMTP credentials missing'
      });
    }

    // Test email
    const testEmail = process.env.SMTP_USER || 'test@example.com';
    const subject = 'Test Email from Katsina State National MSME Clinic Backend';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Test Email</h2>
        <p>This is a test email sent from your backend API.</p>
        <p>If you received this, your email service is working correctly!</p>
        <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p><strong>Available Email Accounts:</strong> ${emailAccounts.length}</p>
      </div>
    `;

    const result = await emailService.sendEmail(testEmail, subject, html);

    if (result.success) {
      res.json({
        success: true,
        message: 'Email service is working',
        data: {
          messageId: result.messageId,
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
