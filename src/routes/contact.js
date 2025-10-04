const express = require('express');
const router = express.Router();
const ContactMessage = require('../database/models/ContactMessage');
const { contactMessageSchema, validate } = require('../utils/validation');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// POST /api/contact - Submit contact form
router.post('/',
  validate(contactMessageSchema),
  asyncHandler(async (req, res) => {
    const contactData = req.body;

    // Create new contact message
    const contactMessage = new ContactMessage(contactData);
    await contactMessage.save();


    res.status(201).json({
      success: true,
      message: 'Message sent successfully'
    });
  })
);

module.exports = router;