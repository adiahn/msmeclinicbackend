const express = require('express');
const router = express.Router();
const emailLogger = require('../utils/emailLogger');
const logger = require('../utils/logger');

// GET /api/test-email - Test email logging
router.get('/', async (req, res) => {
  try {
    logger.info('Testing email logging service...');
    
    // Test email logging
    const testEmail = process.env.SMTP_USER || 'test@example.com';
    const subject = 'Test Email from Katsina State National MSME Clinic Backend';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Test Email</h2>
        <p>This is a test email logged from your backend API.</p>
        <p>Since SMTP is blocked on Render free tier, emails are being logged instead.</p>
        <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p><strong>Status:</strong> Email logged successfully</p>
      </div>
    `;

    const result = await emailLogger.logEmail(testEmail, subject, html, 'test_email');

    if (result.success) {
      res.json({
        success: true,
        message: 'Email logging service is working',
        data: {
          messageId: result.messageId,
          status: 'logged',
          note: 'Emails are being logged due to Render free tier SMTP restrictions'
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Email logging failed',
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
