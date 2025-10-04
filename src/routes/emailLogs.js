const express = require('express');
const router = express.Router();
const emailLogger = require('../utils/emailLogger');
const logger = require('../utils/logger');

// GET /api/email-logs - Get all logged emails
router.get('/', (req, res) => {
  try {
    const emails = emailLogger.getLoggedEmails();
    
    res.json({
      success: true,
      count: emails.length,
      data: emails
    });
  } catch (error) {
    logger.error('Failed to get email logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get email logs',
      details: error.message
    });
  }
});

// GET /api/email-logs/:type - Get emails by type
router.get('/:type', (req, res) => {
  try {
    const { type } = req.params;
    const allEmails = emailLogger.getLoggedEmails();
    const filteredEmails = allEmails.filter(email => email.type === type);
    
    res.json({
      success: true,
      count: filteredEmails.length,
      type: type,
      data: filteredEmails
    });
  } catch (error) {
    logger.error('Failed to get email logs by type:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get email logs by type',
      details: error.message
    });
  }
});

module.exports = router;
