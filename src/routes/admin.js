const express = require('express');
const router = express.Router();
const Registration = require('../database/models/Registration');
const ContactMessage = require('../database/models/ContactMessage');
const { statusUpdateSchema, queryParamsSchema, validate } = require('../utils/validation');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { authenticateToken, requireRole } = require('../middleware/auth');
const emailService = require('../utils/emailService');
const logger = require('../utils/logger');

// GET /api/admin/registrations - Get all registrations with filters and pagination
router.get('/registrations',
  authenticateToken,
  validate(queryParamsSchema, 'query'),
  asyncHandler(async (req, res) => {
    const { 
      page, 
      limit, 
      status, 
      search, 
      businessType, 
      yearsInBusiness,
      dateFrom,
      dateTo 
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (status) filter.status = status;
    if (businessType) filter.businessType = businessType;
    if (yearsInBusiness) filter.yearsInBusiness = yearsInBusiness;
    
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    // Build search query
    let searchQuery = {};
    if (search) {
      searchQuery = {
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { businessName: { $regex: search, $options: 'i' } },
          { registrationId: { $regex: search, $options: 'i' } }
        ]
      };
    }

    // Combine filters
    const finalFilter = { ...filter, ...searchQuery };

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count
    const totalRecords = await Registration.countDocuments(finalFilter);
    const totalPages = Math.ceil(totalRecords / limit);

    // Get registrations
    const registrations = await Registration.find(finalFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: {
        registrations,
        pagination: {
          currentPage: page,
          totalPages,
          totalRecords,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  })
);

// GET /api/admin/registrations/:id - Get single registration
router.get('/registrations/:id',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const registration = await Registration.findById(id);
    if (!registration) {
      throw new AppError('Registration not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: registration
    });
  })
);

// PATCH /api/admin/registrations/:id/status - Update registration status
router.patch('/registrations/:id/status',
  authenticateToken,
  validate(statusUpdateSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const registration = await Registration.findById(id);
    if (!registration) {
      throw new AppError('Registration not found', 404, 'NOT_FOUND');
    }

    const oldStatus = registration.status;
    registration.status = status;
    await registration.save();

    // Send status update email
    try {
      await emailService.sendStatusUpdateNotification(registration, status);
      logger.info(`Status update email sent to ${registration.email} for status change: ${oldStatus} -> ${status}`);
    } catch (emailError) {
      logger.error('Failed to send status update email:', emailError);
      // Don't fail the status update if email fails
    }

    logger.info(`Registration ${registration.registrationId} status updated from ${oldStatus} to ${status} by admin ${req.admin.email}`);

    res.json({
      success: true,
      message: 'Status updated successfully'
    });
  })
);

// GET /api/admin/registrations/export - Export registrations
router.get('/registrations/export',
  authenticateToken,
  validate(queryParamsSchema, 'query'),
  asyncHandler(async (req, res) => {
    const { format, status, businessType, dateFrom, dateTo } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (businessType) filter.businessType = businessType;
    
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    // Get registrations
    const registrations = await Registration.find(filter).sort({ createdAt: -1 }).lean();

    if (format === 'csv') {
      // Generate CSV
      const csv = generateCSV(registrations);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=registrations.csv');
      res.send(csv);
    } else if (format === 'excel') {
      // Generate Excel
      const excel = await generateExcel(registrations);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=registrations.xlsx');
      res.send(excel);
    } else if (format === 'pdf') {
      // Generate PDF
      const pdf = await generatePDF(registrations);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=registrations.pdf');
      res.send(pdf);
    } else {
      throw new AppError('Invalid export format', 400, 'VALIDATION_ERROR');
    }

    logger.info(`Registrations exported in ${format} format by admin ${req.admin.email}`);
  })
);

// GET /api/admin/contact-messages - Get contact messages
router.get('/contact-messages',
  authenticateToken,
  validate(queryParamsSchema, 'query'),
  asyncHandler(async (req, res) => {
    const { page, limit, status, search } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;

    // Build search query
    let searchQuery = {};
    if (search) {
      searchQuery = {
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { subject: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const finalFilter = { ...filter, ...searchQuery };
    const skip = (page - 1) * limit;

    const totalRecords = await ContactMessage.countDocuments(finalFilter);
    const totalPages = Math.ceil(totalRecords / limit);

    const messages = await ContactMessage.find(finalFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('repliedBy', 'name email')
      .lean();

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          currentPage: page,
          totalPages,
          totalRecords,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  })
);

// PATCH /api/admin/contact-messages/:id/status - Update contact message status
router.patch('/contact-messages/:id/status',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const message = await ContactMessage.findById(id);
    if (!message) {
      throw new AppError('Contact message not found', 404, 'NOT_FOUND');
    }

    message.status = status;
    if (adminNotes) message.adminNotes = adminNotes;
    if (status === 'replied') {
      message.repliedBy = req.admin._id;
    }

    await message.save();

    logger.info(`Contact message ${id} status updated to ${status} by admin ${req.admin.email}`);

    res.json({
      success: true,
      message: 'Status updated successfully'
    });
  })
);

// Helper function to generate CSV
function generateCSV(registrations) {
  const headers = [
    'Registration ID', 'Participant ID', 'First Name', 'Last Name', 'Email', 'Phone',
    'Business Name', 'Business Type', 'Business Address', 'Years in Business',
    'Availability', 'Preferred Time', 'Status', 'Created At'
  ];

  const rows = registrations.map(reg => [
    reg.registrationId || '',
    reg.participantId || '',
    reg.firstName || '',
    reg.lastName || '',
    reg.email || '',
    reg.phone || '',
    reg.businessName || '',
    reg.businessType || '',
    reg.businessAddress || '',
    reg.yearsInBusiness || '',
    reg.availability || '',
    reg.preferredTime || '',
    reg.status || '',
    reg.createdAt ? new Date(reg.createdAt).toISOString() : ''
  ]);

  return [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
}

// Helper function to generate Excel
async function generateExcel(registrations) {
  const XLSX = require('xlsx');
  
  const data = registrations.map(reg => ({
    'Registration ID': reg.registrationId || '',
    'Participant ID': reg.participantId || '',
    'First Name': reg.firstName || '',
    'Last Name': reg.lastName || '',
    'Email': reg.email || '',
    'Phone': reg.phone || '',
    'Business Name': reg.businessName || '',
    'Business Type': reg.businessType || '',
    'Business Address': reg.businessAddress || '',
    'Years in Business': reg.yearsInBusiness || '',
    'Availability': reg.availability || '',
    'Preferred Time': reg.preferredTime || '',
    'Status': reg.status || '',
    'Created At': reg.createdAt ? new Date(reg.createdAt).toISOString() : ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations');
  
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

// Helper function to generate PDF
async function generatePDF(registrations) {
  const PDFDocument = require('pdfkit');
  const doc = new PDFDocument();
  
  // Set up the document
  doc.fontSize(20).text('MSME Clinic Registrations', 100, 50);
  doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, 100, 80);
  doc.text(`Total Registrations: ${registrations.length}`, 100, 100);
  
  let yPosition = 130;
  
  registrations.forEach((reg, index) => {
    if (yPosition > 700) {
      doc.addPage();
      yPosition = 50;
    }
    
    doc.fontSize(14).text(`${index + 1}. ${reg.firstName} ${reg.lastName}`, 100, yPosition);
    yPosition += 20;
    
    doc.fontSize(10).text(`Registration ID: ${reg.registrationId || 'N/A'}`, 100, yPosition);
    yPosition += 15;
    doc.text(`Email: ${reg.email}`, 100, yPosition);
    yPosition += 15;
    doc.text(`Business: ${reg.businessName}`, 100, yPosition);
    yPosition += 15;
    doc.text(`Type: ${reg.businessType}`, 100, yPosition);
    yPosition += 15;
    doc.text(`Status: ${reg.status}`, 100, yPosition);
    yPosition += 15;
    doc.text(`Created: ${new Date(reg.createdAt).toLocaleDateString()}`, 100, yPosition);
    yPosition += 30;
  });
  
  doc.end();
  
  return new Promise((resolve) => {
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

module.exports = router;
