const Joi = require('joi');

// Common validation schemas
const commonSchemas = {
  email: Joi.string()
    .email()
    .lowercase()
    .trim()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),

  phone: Joi.string()
    .pattern(/^\+234[0-9]{10}$/)
    .required()
    .messages({
      'string.pattern.base': 'Please provide a valid Nigerian phone number (+234XXXXXXXXXX)',
      'any.required': 'Phone number is required'
    }),

  name: Joi.string()
    .min(2)
    .max(100)
    .trim()
    .required()
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 100 characters',
      'any.required': 'Name is required'
    }),

  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required'
    })
};

// Registration validation schema
const registrationSchema = Joi.object({
  firstName: commonSchemas.name,
  lastName: commonSchemas.name,
  email: commonSchemas.email,
  phone: commonSchemas.phone,
  aboutBusiness: Joi.string()
    .min(10)
    .max(1000)
    .trim()
    .required()
    .messages({
      'string.min': 'About business must be at least 10 characters long',
      'string.max': 'About business cannot exceed 1000 characters',
      'any.required': 'About business is required'
    }),
  cacNo: Joi.string()
    .max(50)
    .trim()
    .allow('')
    .optional()
    .messages({
      'string.max': 'CAC number cannot exceed 50 characters'
    }),
  kasedaCertNo: Joi.string()
    .max(50)
    .trim()
    .allow('')
    .optional()
    .messages({
      'string.max': 'KASEDA certificate number cannot exceed 50 characters'
    }),
  businessName: Joi.string()
    .min(2)
    .max(255)
    .trim()
    .required()
    .messages({
      'string.min': 'Business name must be at least 2 characters long',
      'string.max': 'Business name cannot exceed 255 characters',
      'any.required': 'Business name is required'
    }),
  businessType: Joi.string()
    .valid('retail', 'manufacturing', 'services', 'technology', 'healthcare', 'education', 'food', 'agriculture', 'other')
    .required()
    .messages({
      'any.only': 'Business type must be one of: retail, manufacturing, services, technology, healthcare, education, food, agriculture, other',
      'any.required': 'Business type is required'
    }),
  businessAddress: Joi.string()
    .min(10)
    .max(500)
    .trim()
    .required()
    .messages({
      'string.min': 'Business address must be at least 10 characters long',
      'string.max': 'Business address cannot exceed 500 characters',
      'any.required': 'Business address is required'
    }),
  yearsInBusiness: Joi.string()
    .valid('0-1', '2-3', '4-5', '6-10', '10+')
    .required()
    .messages({
      'any.only': 'Years in business must be one of: 0-1, 2-3, 4-5, 6-10, 10+',
      'any.required': 'Years in business is required'
    }),
  expectations: Joi.string()
    .min(10)
    .max(1000)
    .trim()
    .required()
    .messages({
      'string.min': 'Expectations must be at least 10 characters long',
      'string.max': 'Expectations cannot exceed 1000 characters',
      'any.required': 'Expectations is required'
    }),
  availability: Joi.string()
    .valid('immediately', '1-month', '2-3-months', '3-6-months', 'flexible')
    .required()
    .messages({
      'any.only': 'Availability must be one of: immediately, 1-month, 2-3-months, 3-6-months, flexible',
      'any.required': 'Availability is required'
    }),
  preferredTime: Joi.string()
    .valid('morning', 'afternoon', 'evening', 'weekend', 'flexible')
    .required()
    .messages({
      'any.only': 'Preferred time must be one of: morning, afternoon, evening, weekend, flexible',
      'any.required': 'Preferred time is required'
    }),
  additionalInfo: Joi.string()
    .max(1000)
    .trim()
    .allow('')
    .optional()
    .messages({
      'string.max': 'Additional info cannot exceed 1000 characters'
    })
});

// Contact message validation schema
const contactMessageSchema = Joi.object({
  firstName: commonSchemas.name,
  lastName: commonSchemas.name,
  email: commonSchemas.email,
  subject: Joi.string()
    .min(5)
    .max(255)
    .trim()
    .required()
    .messages({
      'string.min': 'Subject must be at least 5 characters long',
      'string.max': 'Subject cannot exceed 255 characters',
      'any.required': 'Subject is required'
    }),
  message: Joi.string()
    .min(10)
    .max(2000)
    .trim()
    .required()
    .messages({
      'string.min': 'Message must be at least 10 characters long',
      'string.max': 'Message cannot exceed 2000 characters',
      'any.required': 'Message is required'
    })
});

// Admin login validation schema
const adminLoginSchema = Joi.object({
  email: commonSchemas.email,
  password: Joi.string()
    .min(1)
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

// Admin registration validation schema
const adminRegistrationSchema = Joi.object({
  email: commonSchemas.email,
  password: commonSchemas.password,
  name: commonSchemas.name,
  role: Joi.string()
    .valid('admin', 'super_admin')
    .default('admin')
    .messages({
      'any.only': 'Role must be either admin or super_admin'
    })
});

// Status update validation schema
const statusUpdateSchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'confirmed', 'rejected')
    .required()
    .messages({
      'any.only': 'Status must be one of: pending, confirmed, rejected',
      'any.required': 'Status is required'
    })
});

// Email confirmation validation schema
const emailConfirmationSchema = Joi.object({
  email: commonSchemas.email,
  registrationId: Joi.string()
    .pattern(/^REG-\d{4}-\d{3}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid registration ID format',
      'any.required': 'Registration ID is required'
    })
});

// File upload validation schema
const fileUploadSchema = Joi.object({
  type: Joi.string()
    .valid('cac_certificate', 'kaseda_certificate', 'other')
    .required()
    .messages({
      'any.only': 'File type must be one of: cac_certificate, kaseda_certificate, other',
      'any.required': 'File type is required'
    }),
  registrationId: Joi.string()
    .pattern(/^REG-\d{4}-\d{3}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Invalid registration ID format'
    })
});

// Query parameters validation schemas
const queryParamsSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1'
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    }),
  status: Joi.string()
    .valid('pending', 'confirmed', 'rejected')
    .optional()
    .messages({
      'any.only': 'Status must be one of: pending, confirmed, rejected'
    }),
  search: Joi.string()
    .max(100)
    .trim()
    .optional()
    .messages({
      'string.max': 'Search term cannot exceed 100 characters'
    }),
  businessType: Joi.string()
    .valid('retail', 'manufacturing', 'services', 'technology', 'healthcare', 'education', 'food', 'other')
    .optional()
    .messages({
      'any.only': 'Business type must be one of: retail, manufacturing, services, technology, healthcare, education, food, other'
    }),
  yearsInBusiness: Joi.string()
    .valid('0-1', '2-3', '4-5', '6-10', '10+')
    .optional()
    .messages({
      'any.only': 'Years in business must be one of: 0-1, 2-3, 4-5, 6-10, 10+'
    }),
  dateFrom: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': 'Date from must be in ISO format'
    }),
  dateTo: Joi.date()
    .iso()
    .min(Joi.ref('dateFrom'))
    .optional()
    .messages({
      'date.format': 'Date to must be in ISO format',
      'date.min': 'Date to must be after date from'
    }),
  format: Joi.string()
    .valid('csv', 'excel', 'pdf')
    .optional()
    .messages({
      'any.only': 'Format must be one of: csv, excel, pdf'
    })
});

// Validation middleware factory
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errorDetails
        }
      });
    }

    req[property] = value;
    next();
  };
};

module.exports = {
  commonSchemas,
  registrationSchema,
  contactMessageSchema,
  adminLoginSchema,
  adminRegistrationSchema,
  statusUpdateSchema,
  emailConfirmationSchema,
  fileUploadSchema,
  queryParamsSchema,
  validate
};