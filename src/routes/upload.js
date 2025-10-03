const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const UploadedFile = require('../database/models/UploadedFile');
const { fileUploadSchema, validate } = require('../utils/validation');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const logger = require('../utils/logger');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    
    // Create upload directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = uuidv4();
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const filename = `${name}-${uniqueSuffix}${ext}`;
    cb(null, filename);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'pdf,doc,docx,jpg,jpeg,png').split(',');
  const fileExt = path.extname(file.originalname).toLowerCase().substring(1);
  
  if (allowedTypes.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new AppError(`File type .${fileExt} is not allowed`, 400, 'INVALID_FILE_TYPE'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
    files: 1 // Only one file at a time
  }
});

// POST /api/upload/documents - Upload documents
router.post('/documents',
  optionalAuth,
  upload.single('file'),
  validate(fileUploadSchema),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new AppError('No file uploaded', 400, 'VALIDATION_ERROR');
    }

    const { type, registrationId } = req.body;
    const file = req.file;

    // Validate file size
    const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024;
    if (file.size > maxSize) {
      // Delete the uploaded file
      fs.unlinkSync(file.path);
      throw new AppError('File too large', 400, 'FILE_TOO_LARGE');
    }

    // Determine upload type based on file extension
    const fileExt = path.extname(file.originalname).toLowerCase();
    let uploadType = 'other';
    
    if (['.pdf', '.doc', '.docx'].includes(fileExt)) {
      uploadType = 'document';
    } else if (['.jpg', '.jpeg', '.png'].includes(fileExt)) {
      uploadType = 'image';
    }

    // Create uploaded file record
    const uploadedFile = new UploadedFile({
      fileName: file.filename,
      originalName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      fileType: type,
      uploadType: uploadType,
      uploadedBy: req.admin ? req.admin._id : null
    });

    // If registrationId is provided, link the file to registration
    if (registrationId) {
      const Registration = require('../database/models/Registration');
      const registration = await Registration.findOne({ registrationId });
      if (registration) {
        uploadedFile.registration = registration._id;
      }
    }

    await uploadedFile.save();

    logger.info(`File uploaded: ${file.originalname} by ${req.admin ? req.admin.email : 'anonymous'}`);

    res.json({
      success: true,
      data: {
        fileId: uploadedFile._id,
        fileName: uploadedFile.fileName,
        fileUrl: uploadedFile.fileUrl,
        fileSize: uploadedFile.fileSize,
        formattedFileSize: uploadedFile.formattedFileSize,
        mimeType: uploadedFile.mimeType,
        fileType: uploadedFile.fileType,
        uploadType: uploadedFile.uploadType
      }
    });
  })
);

// GET /api/upload/files - Get uploaded files (admin only)
router.get('/files',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, type, uploadType } = req.query;
    
    const filter = { isActive: true };
    if (type) filter.fileType = type;
    if (uploadType) filter.uploadType = uploadType;

    const skip = (page - 1) * limit;
    const totalFiles = await UploadedFile.countDocuments(filter);
    const totalPages = Math.ceil(totalFiles / limit);

    const files = await UploadedFile.find(filter)
      .populate('registration', 'registrationId businessName firstName lastName')
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: {
        files,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalFiles,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  })
);

// GET /api/upload/files/:id - Get single file info
router.get('/files/:id',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const file = await UploadedFile.findById(id)
      .populate('registration', 'registrationId businessName firstName lastName')
      .populate('uploadedBy', 'name email');

    if (!file) {
      throw new AppError('File not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: file
    });
  })
);

// GET /api/upload/files/:id/download - Download file
router.get('/files/:id/download',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const file = await UploadedFile.findById(id);
    if (!file) {
      throw new AppError('File not found', 404, 'NOT_FOUND');
    }

    // Check if file exists on disk
    if (!fs.existsSync(file.filePath)) {
      throw new AppError('File not found on disk', 404, 'NOT_FOUND');
    }

    // Increment download count
    await file.incrementDownload();

    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Length', file.fileSize);

    // Stream the file
    const fileStream = fs.createReadStream(file.filePath);
    fileStream.pipe(res);

    logger.info(`File downloaded: ${file.originalName} by admin ${req.admin.email}`);
  })
);

// DELETE /api/upload/files/:id - Delete file
router.delete('/files/:id',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const file = await UploadedFile.findById(id);
    if (!file) {
      throw new AppError('File not found', 404, 'NOT_FOUND');
    }

    // Delete file from disk
    if (fs.existsSync(file.filePath)) {
      fs.unlinkSync(file.filePath);
    }

    // Mark as inactive instead of deleting from database
    file.isActive = false;
    await file.save();

    logger.info(`File deleted: ${file.originalName} by admin ${req.admin.email}`);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  })
);

// Error handler for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'File too large'
        }
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'TOO_MANY_FILES',
          message: 'Too many files'
        }
      });
    }
  }
  
  next(error);
});

module.exports = router;
