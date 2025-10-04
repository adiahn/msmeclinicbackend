const express = require('express');
const router = express.Router();
const Registration = require('../database/models/Registration');
const { registrationSchema, emailConfirmationSchema, validate } = require('../utils/validation');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const emailService = require('../utils/emailService');
const logger = require('../utils/logger');
const { connectDB } = require('../database/vercelConnection');

// POST /api/register - Submit registration
router.post('/', 
  validate(registrationSchema),
  asyncHandler(async (req, res) => {
    // Ensure database connection
    await connectDB();
    
    const registrationData = req.body;

    // Check if email already exists
    const existingRegistration = await Registration.findOne({ email: registrationData.email });
    if (existingRegistration) {
      throw new AppError('Email already registered', 400, 'DUPLICATE_EMAIL');
    }

    // Create new registration
    const registration = new Registration(registrationData);
    await registration.save();

    // Send confirmation email
    try {
      await emailService.sendRegistrationConfirmation(registration);
      logger.info(`Registration confirmation email sent to ${registration.email}`);
    } catch (emailError) {
      logger.error('Failed to send registration confirmation email:', emailError);
      // Don't fail the registration if email fails
    }

    // Send new registration alert to admin
    try {
      await emailService.sendNewRegistrationAlert(registration);
      logger.info(`New registration alert sent to admin for ${registration.email}`);
    } catch (emailError) {
      logger.error('Failed to send new registration alert:', emailError);
      // Don't fail the registration if email fails
    }

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