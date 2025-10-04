const express = require('express');
const router = express.Router();
const Registration = require('../database/models/Registration');
const { registrationSchema, emailConfirmationSchema, validate } = require('../utils/validation');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const emailService = require('../utils/emailService');
const logger = require('../utils/logger');
const timeout = require('../middleware/timeout');

// POST /api/register - Submit registration
router.post('/', 
  timeout(5000), // 5 second timeout - force faster responses
  validate(registrationSchema),
  asyncHandler(async (req, res) => {
    const startTime = Date.now();
    const registrationData = req.body;
    let registration = null;

    try {
      logger.info(`Registration request started for email: ${registrationData.email}`);
      
      // Check if email already exists (with index optimization)
      const emailCheckStart = Date.now();
      const existingRegistration = await Registration.findOne({ email: registrationData.email }).lean();
      const emailCheckTime = Date.now() - emailCheckStart;
      logger.info(`Email check completed in ${emailCheckTime}ms`);
      
      if (existingRegistration) {
        throw new AppError('Email already registered', 400, 'DUPLICATE_EMAIL');
      }

      // Create new registration
      const saveStart = Date.now();
      registration = new Registration(registrationData);
      await registration.save();
      const saveTime = Date.now() - saveStart;
      logger.info(`Registration saved in ${saveTime}ms`);

      // Send response immediately (don't wait for emails)
      const totalTime = Date.now() - startTime;
      logger.info(`Registration completed successfully in ${totalTime}ms for email: ${registrationData.email}`);
      
      res.status(201).json({
        success: true,
        message: 'Registration successful - You are confirmed to attend!',
        data: {
          registrationId: registration.registrationId,
          participantId: registration.participantId,
          email: registration.email,
          status: 'confirmed_to_attend'
        }
      });

      // Send emails asynchronously (non-blocking)
      setImmediate(async () => {
        try {
          // Send confirmation email with timeout
          const emailPromise = emailService.sendRegistrationConfirmation(registration);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Email timeout')), 10000)
          );
          
          await Promise.race([emailPromise, timeoutPromise]);
          logger.info(`Registration confirmation email sent to ${registration.email}`);
        } catch (emailError) {
          logger.error('Failed to send registration confirmation email:', emailError);
        }

        try {
          // Send admin alert with timeout
          const alertPromise = emailService.sendNewRegistrationAlert(registration);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Email timeout')), 10000)
          );
          
          await Promise.race([alertPromise, timeoutPromise]);
          logger.info(`New registration alert sent to admin for ${registration.email}`);
        } catch (emailError) {
          logger.error('Failed to send new registration alert:', emailError);
        }
      });

    } catch (error) {
      // If registration was saved but response failed, we need to handle this
      if (registration && registration._id) {
        logger.error('Registration saved but response failed, cleaning up:', error);
        try {
          await Registration.findByIdAndDelete(registration._id);
        } catch (cleanupError) {
          logger.error('Failed to cleanup registration after error:', cleanupError);
        }
      }
      throw error;
    }
  })
);

// POST /api/send-confirmation - Send confirmation email
router.post('/send-confirmation',
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

    // Send confirmation email
    const emailResult = await emailService.sendRegistrationConfirmation(registration);
    
    if (!emailResult.success) {
      throw new AppError('Failed to send confirmation email', 500, 'EMAIL_SEND_FAILED');
    }

    res.json({
      success: true,
      message: 'Confirmation email sent successfully'
    });
  })
);

// GET /api/register/:id - Get single registration (public, for confirmation)
router.get('/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Try to find by registrationId first, then by _id
    let registration = await Registration.findOne({ registrationId: id });
    if (!registration) {
      registration = await Registration.findById(id);
    }

    if (!registration) {
      throw new AppError('Registration not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: {
        id: registration._id,
        firstName: registration.firstName,
        lastName: registration.lastName,
        email: registration.email,
        phone: registration.phone,
        aboutBusiness: registration.aboutBusiness,
        cacNo: registration.cacNo,
        kasedaCertNo: registration.kasedaCertNo,
        businessName: registration.businessName,
        businessType: registration.businessType,
        businessAddress: registration.businessAddress,
        yearsInBusiness: registration.yearsInBusiness,
        expectations: registration.expectations,
        availability: registration.availability,
        preferredTime: registration.preferredTime,
        additionalInfo: registration.additionalInfo,
        status: registration.status,
        registrationId: registration.registrationId,
        participantId: registration.participantId,
        createdAt: registration.createdAt,
        updatedAt: registration.updatedAt
      }
    });
  })
);

module.exports = router;