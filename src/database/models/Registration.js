const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [100, 'First name cannot exceed 100 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [100, 'Last name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^\+234[0-9]{10}$/, 'Please enter a valid Nigerian phone number (+234XXXXXXXXXX)']
  },
  aboutBusiness: {
    type: String,
    required: [true, 'About business is required'],
    trim: true,
    maxlength: [1000, 'About business cannot exceed 1000 characters']
  },
  cacNo: {
    type: String,
    trim: true,
    maxlength: [50, 'CAC number cannot exceed 50 characters']
  },
  kasedaCertNo: {
    type: String,
    trim: true,
    maxlength: [50, 'KASEDA certificate number cannot exceed 50 characters']
  },
  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true,
    maxlength: [255, 'Business name cannot exceed 255 characters']
  },
  businessType: {
    type: String,
    required: [true, 'Business type is required'],
    enum: {
      values: ['retail', 'manufacturing', 'services', 'technology', 'healthcare', 'education', 'food', 'agriculture', 'other'],
      message: 'Business type must be one of: retail, manufacturing, services, technology, healthcare, education, food, agriculture, other'
    }
  },
  businessAddress: {
    type: String,
    required: [true, 'Business address is required'],
    trim: true,
    maxlength: [500, 'Business address cannot exceed 500 characters']
  },
  yearsInBusiness: {
    type: String,
    required: [true, 'Years in business is required'],
    enum: {
      values: ['0-1', '2-3', '4-5', '6-10', '10+'],
      message: 'Years in business must be one of: 0-1, 2-3, 4-5, 6-10, 10+'
    }
  },
  expectations: {
    type: String,
    required: [true, 'Expectations is required'],
    trim: true,
    maxlength: [1000, 'Expectations cannot exceed 1000 characters']
  },
  availability: {
    type: String,
    required: [true, 'Availability is required'],
    enum: {
      values: ['immediately', '1-month', '2-3-months', '3-6-months', 'flexible'],
      message: 'Availability must be one of: immediately, 1-month, 2-3-months, 3-6-months, flexible'
    }
  },
  preferredTime: {
    type: String,
    required: [true, 'Preferred time is required'],
    enum: {
      values: ['morning', 'afternoon', 'evening', 'weekend', 'flexible'],
      message: 'Preferred time must be one of: morning, afternoon, evening, weekend, flexible'
    }
  },
  additionalInfo: {
    type: String,
    trim: true,
    maxlength: [1000, 'Additional info cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'confirmed', 'rejected'],
      message: 'Status must be one of: pending, confirmed, rejected'
    },
    default: 'pending'
  },
  registrationId: {
    type: String,
    unique: true,
    sparse: true
  },
  participantId: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
registrationSchema.index({ status: 1 });
registrationSchema.index({ businessType: 1 });
registrationSchema.index({ yearsInBusiness: 1 });
registrationSchema.index({ createdAt: -1 });

// Virtual for full name
registrationSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware to generate registration ID
registrationSchema.pre('save', async function(next) {
  if (this.isNew && !this.registrationId) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({ 
      createdAt: { 
        $gte: new Date(year, 0, 1), 
        $lt: new Date(year + 1, 0, 1) 
      } 
    });
    this.registrationId = `REG-${year}-${String(count + 1).padStart(3, '0')}`;
  }
  
  if (this.isNew && !this.participantId) {
    this.participantId = `PART-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  }
  
  next();
});

module.exports = mongoose.model('Registration', registrationSchema);