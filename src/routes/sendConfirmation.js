const express = require('express');
const router = express.Router();
const Registration = require('../database/models/Registration');
const { emailConfirmationSchema, validate } = require('../utils/validation');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const emailService = require('../utils/emailService');
const logger = require('../utils/logger');
const timeout = require('../middleware/timeout');

// POST /api/send-confirmation - Send confirmation email
router.post('/',
  timeout(5000), // 5 second timeout for email sending
  validate(emailConfirmationSchema),
  asyncHandler(async (req, res) => {
    const { email, registrationId } = req.body;

    // Find registration
    const registration = await Registration.findOne({ 
      email: email.toLowerCase(), 
      registrationId 
    });

    if (!registration) {
      throw new AppError('Registration not found', 404, 'NOT_FOUND');
    }

    // Send confirmation email with timeout
    try {
      const emailPromise = emailService.sendRegistrationConfirmation(registration);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email timeout')), 5000)
      );
      
      await Promise.race([emailPromise, timeoutPromise]);
      logger.info(`Confirmation email resent to ${registration.email}`);
      
      res.json({
        success: true,
        message: 'Confirmation email sent successfully',
        data: {
          email: registration.email,
          registrationId: registration.registrationId
        }
      });
    } catch (error) {
      logger.error('Failed to send confirmation email:', error);
      throw new AppError('Failed to send confirmation email', 500, 'EMAIL_SEND_FAILED');
    }
  })
);

module.exports = router;
