const mongoose = require('mongoose');

const uploadedFileSchema = new mongoose.Schema({
  registration: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Registration',
    required: false // Optional for general file uploads
  },
  fileName: {
    type: String,
    required: [true, 'File name is required'],
    trim: true,
    maxlength: [255, 'File name cannot exceed 255 characters']
  },
  originalName: {
    type: String,
    required: [true, 'Original file name is required'],
    trim: true,
    maxlength: [255, 'Original file name cannot exceed 255 characters']
  },
  filePath: {
    type: String,
    required: [true, 'File path is required'],
    trim: true,
    maxlength: [500, 'File path cannot exceed 500 characters']
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required'],
    min: [1, 'File size must be greater than 0']
  },
  mimeType: {
    type: String,
    required: [true, 'MIME type is required'],
    trim: true
  },
  fileType: {
    type: String,
    required: [true, 'File type is required'],
    enum: {
      values: ['cac_certificate', 'kaseda_certificate', 'other'],
      message: 'File type must be one of: cac_certificate, kaseda_certificate, other'
    }
  },
  uploadType: {
    type: String,
    required: [true, 'Upload type is required'],
    enum: {
      values: ['document', 'image', 'other'],
      message: 'Upload type must be one of: document, image, other'
    }
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: false // Optional for public uploads
  },
  isActive: {
    type: Boolean,
    default: true
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  lastAccessed: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
uploadedFileSchema.index({ registration: 1 });
uploadedFileSchema.index({ fileType: 1 });
uploadedFileSchema.index({ uploadType: 1 });
uploadedFileSchema.index({ isActive: 1 });
uploadedFileSchema.index({ createdAt: -1 });

// Virtual for file URL
uploadedFileSchema.virtual('fileUrl').get(function() {
  return `/uploads/${this.fileName}`;
});

// Virtual for formatted file size
uploadedFileSchema.virtual('formattedFileSize').get(function() {
  const bytes = this.fileSize;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
});

// Pre-save middleware to update lastAccessed when file is accessed
uploadedFileSchema.methods.incrementDownload = function() {
  this.downloadCount += 1;
  this.lastAccessed = new Date();
  return this.save();
};

module.exports = mongoose.model('UploadedFile', uploadedFileSchema);