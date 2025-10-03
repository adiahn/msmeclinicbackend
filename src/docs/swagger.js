const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Katsina State National MSME Clinic Registration System API',
      version: '1.0.0',
      description: 'Backend API for Katsina State National MSME Clinic Registration System',
      contact: {
        name: 'Katsina State National MSME Clinic Team',
        email: 'kasedakatsinastate@gmail.com'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:5000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Registration: {
          type: 'object',
          required: ['firstName', 'lastName', 'email', 'phone', 'aboutBusiness', 'businessName', 'businessType', 'businessAddress', 'yearsInBusiness', 'expectations', 'availability', 'preferredTime'],
          properties: {
            firstName: {
              type: 'string',
              maxLength: 100,
              description: 'First name of the participant'
            },
            lastName: {
              type: 'string',
              maxLength: 100,
              description: 'Last name of the participant'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address of the participant'
            },
            phone: {
              type: 'string',
              pattern: '^\\+234[0-9]{10}$',
              description: 'Nigerian phone number (+234XXXXXXXXXX)'
            },
            aboutBusiness: {
              type: 'string',
              maxLength: 1000,
              description: 'Description of the business'
            },
            cacNo: {
              type: 'string',
              maxLength: 50,
              description: 'CAC registration number (optional)'
            },
            kasedaCertNo: {
              type: 'string',
              maxLength: 50,
              description: 'KASEDA certificate number (optional)'
            },
            businessName: {
              type: 'string',
              maxLength: 255,
              description: 'Name of the business'
            },
            businessType: {
              type: 'string',
              enum: ['retail', 'manufacturing', 'services', 'technology', 'healthcare', 'education', 'food', 'agriculture', 'other'],
              description: 'Type of business'
            },
            businessAddress: {
              type: 'string',
              maxLength: 500,
              description: 'Address of the business'
            },
            yearsInBusiness: {
              type: 'string',
              enum: ['0-1', '2-3', '4-5', '6-10', '10+'],
              description: 'Years in business'
            },
            expectations: {
              type: 'string',
              maxLength: 1000,
              description: 'Expectations from the clinic'
            },
            availability: {
              type: 'string',
              enum: ['immediately', '1-month', '2-3-months', '3-6-months', 'flexible'],
              description: 'Availability for the clinic'
            },
            preferredTime: {
              type: 'string',
              enum: ['morning', 'afternoon', 'evening', 'weekend', 'flexible'],
              description: 'Preferred time for the clinic'
            },
            additionalInfo: {
              type: 'string',
              maxLength: 1000,
              description: 'Additional information (optional)'
            }
          }
        },
        ContactMessage: {
          type: 'object',
          required: ['firstName', 'lastName', 'email', 'subject', 'message'],
          properties: {
            firstName: {
              type: 'string',
              maxLength: 100,
              description: 'First name'
            },
            lastName: {
              type: 'string',
              maxLength: 100,
              description: 'Last name'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address'
            },
            subject: {
              type: 'string',
              maxLength: 255,
              description: 'Subject of the message'
            },
            message: {
              type: 'string',
              maxLength: 2000,
              description: 'Message content'
            }
          }
        },
        Admin: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Admin email address'
            },
            name: {
              type: 'string',
              maxLength: 100,
              description: 'Admin name'
            },
            role: {
              type: 'string',
              enum: ['admin', 'super_admin'],
              description: 'Admin role'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'Error code'
                },
                message: {
                  type: 'string',
                  description: 'Error message'
                },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: {
                        type: 'string'
                      },
                      message: {
                        type: 'string'
                      }
                    }
                  }
                }
              }
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              description: 'Success message'
            },
            data: {
              type: 'object',
              description: 'Response data'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js'] // Path to the API files
};

const specs = swaggerJSDoc(options);

module.exports = specs;
