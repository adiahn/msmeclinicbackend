const express = require('express');
const router = express.Router();
const ContactMessage = require('../database/models/ContactMessage');
const { contactMessageSchema, validate } = require('../utils/validation');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const emailService = require('../utils/emailService');
const logger = require('../utils/logger');
const { connectDB } = require('../database/vercelConnection');

// POST /api/contact - Submit contact form
router.post('/',
  validate(contactMessageSchema),
  asyncHandler(async (req, res) => {
    // Ensure database connection
    await connectDB();
    
    const contactData = req.body;

    // Create new contact message
    const contactMessage = new ContactMessage(contactData);
    await contactMessage.save();

    // Send notification email to admin
    try {
      await emailService.sendContactNotification(contactMessage);
      logger.info(`Contact form notification sent to admin for ${contactMessage.email}`);
    } catch (emailError) {
      logger.error('Failed to send contact notification email:', emailError);
      // Don't fail the contact submission if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully'
    });
  })
);

module.exports = router;