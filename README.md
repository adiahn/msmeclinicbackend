# Katsina State National MSME Clinic Registration System - Backend API

A comprehensive backend API for the Katsina State National MSME Clinic Registration System built with Node.js, Express, and MongoDB.

## Features

- **Registration Management**: Complete registration form handling with validation
- **Admin Dashboard**: Full admin interface for managing registrations
- **Contact Form**: Contact message handling system
- **File Upload**: Document upload and management
- **Analytics**: Comprehensive analytics and reporting
- **Email Notifications**: Automated email notifications
- **Authentication**: JWT-based admin authentication
- **API Documentation**: Swagger/OpenAPI documentation

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Email**: Nodemailer
- **Validation**: Joi
- **Documentation**: Swagger/OpenAPI
- **Logging**: Winston
- **File Upload**: Multer

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd msme-clinic-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/msme_clinic
   
   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key_here
   JWT_REFRESH_SECRET=your_refresh_secret_key_here
   JWT_EXPIRES_IN=24h
   JWT_REFRESH_EXPIRES_IN=7d
   
   # Email Configuration
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   FROM_EMAIL=noreply@msmeclinic.com
   FROM_NAME=MSME Clinic
   
   # Application Configuration
   NODE_ENV=development
   PORT=5000
   FRONTEND_URL=http://localhost:3000
   
   # File Upload Configuration
   UPLOAD_PATH=./uploads
   MAX_FILE_SIZE=5242880
   ALLOWED_FILE_TYPES=pdf,doc,docx,jpg,jpeg,png
   
   
   # CORS Configuration
   CORS_ORIGIN=http://localhost:3000
   
   # Logging
   LOG_LEVEL=info
   LOG_FILE=./logs/app.log
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

5. **Seed the database**
   ```bash
   npm run seed
   ```
   This creates a default admin user:
   - Email: `admin@msmeclinic.com`
   - Password: `Admin123!@#`

6. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## API Documentation

Once the server is running, you can access the API documentation at:
- **Swagger UI**: `http://localhost:5000/api/docs`

## API Endpoints

### Registration Endpoints
- `POST /api/register` - Submit registration
- `POST /api/send-confirmation` - Send confirmation email
- `GET /api/register/:id` - Get registration details

### Contact Endpoints
- `POST /api/contact` - Submit contact form

### Authentication Endpoints
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/admin/logout` - Admin logout
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current admin info

### Admin Endpoints
- `GET /api/admin/registrations` - Get all registrations
- `GET /api/admin/registrations/:id` - Get single registration
- `PATCH /api/admin/registrations/:id/status` - Update registration status
- `GET /api/admin/registrations/export` - Export registrations
- `GET /api/admin/contact-messages` - Get contact messages
- `PATCH /api/admin/contact-messages/:id/status` - Update contact message status

### Analytics Endpoints
- `GET /api/analytics/registrations` - Get registration statistics
- `GET /api/analytics/dashboard` - Get dashboard summary

### Upload Endpoints
- `POST /api/upload/documents` - Upload documents
- `GET /api/upload/files` - Get uploaded files
- `GET /api/upload/files/:id` - Get file info
- `GET /api/upload/files/:id/download` - Download file
- `DELETE /api/upload/files/:id` - Delete file

### Health Check
- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed health check

## Database Schema

### Registrations Collection
```javascript
{
  firstName: String (required),
  lastName: String (required),
  email: String (required, unique),
  phone: String (required),
  aboutBusiness: String (required),
  cacNo: String (optional),
  kasedaCertNo: String (optional),
  businessName: String (required),
  businessType: String (required, enum),
  businessAddress: String (required),
  yearsInBusiness: String (required, enum),
  expectations: String (required),
  availability: String (required, enum),
  preferredTime: String (required, enum),
  additionalInfo: String (optional),
  status: String (default: 'pending', enum),
  registrationId: String (auto-generated),
  participantId: String (auto-generated),
  createdAt: Date,
  updatedAt: Date
}
```

### Contact Messages Collection
```javascript
{
  firstName: String (required),
  lastName: String (required),
  email: String (required),
  subject: String (required),
  message: String (required),
  status: String (default: 'unread', enum),
  adminNotes: String (optional),
  repliedAt: Date (optional),
  repliedBy: ObjectId (ref: Admin),
  createdAt: Date,
  updatedAt: Date
}
```

### Admins Collection
```javascript
{
  email: String (required, unique),
  password: String (required, hashed),
  name: String (required),
  role: String (default: 'admin', enum),
  isActive: Boolean (default: true),
  lastLogin: Date (optional),
  refreshTokens: Array,
  createdAt: Date,
  updatedAt: Date
}
```

### Uploaded Files Collection
```javascript
{
  registration: ObjectId (ref: Registration, optional),
  fileName: String (required),
  originalName: String (required),
  filePath: String (required),
  fileSize: Number (required),
  mimeType: String (required),
  fileType: String (required, enum),
  uploadType: String (required, enum),
  uploadedBy: ObjectId (ref: Admin, optional),
  isActive: Boolean (default: true),
  downloadCount: Number (default: 0),
  lastAccessed: Date (optional),
  createdAt: Date,
  updatedAt: Date
}
```

## Security Features

- **Input Validation**: Comprehensive validation using Joi
- **SQL Injection Protection**: MongoDB sanitization
- **XSS Protection**: Input sanitization
- **CORS Configuration**: Configurable CORS settings
- **Helmet**: Security headers
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with 12 rounds

## Error Handling

The API uses a consistent error response format:

```javascript
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional error details (optional)"
  }
}
```

## Logging

The application uses Winston for logging with different levels:
- **Error**: Error logs
- **Warn**: Warning logs
- **Info**: Information logs
- **Debug**: Debug logs

Logs are written to:
- Console (development)
- `logs/error.log` (error logs)
- `logs/combined.log` (all logs)

## File Upload

- **Max File Size**: 5MB (configurable)
- **Allowed Types**: PDF, DOC, DOCX, JPG, JPEG, PNG
- **Storage**: Local filesystem (configurable)
- **Security**: File type validation and size limits

## Email Service

The application supports email notifications for:
- Registration confirmation
- Contact form notifications
- Status update notifications
- Admin alerts

## Development

### Running Tests
```bash
npm test
```

### Code Structure
```
src/
├── database/
│   ├── connection.js
│   ├── models/
│   │   ├── Admin.js
│   │   ├── ContactMessage.js
│   │   ├── Registration.js
│   │   └── UploadedFile.js
│   └── seed.js
├── middleware/
│   ├── auth.js
│   ├── errorHandler.js
│   └── rateLimiter.js
├── routes/
│   ├── admin.js
│   ├── analytics.js
│   ├── auth.js
│   ├── contact.js
│   ├── health.js
│   ├── registration.js
│   └── upload.js
├── utils/
│   ├── emailService.js
│   ├── logger.js
│   └── validation.js
├── docs/
│   └── swagger.js
└── server.js
```

## Production Deployment

1. **Environment Variables**: Set all required environment variables
2. **Database**: Use a production MongoDB instance
3. **File Storage**: Consider using cloud storage (AWS S3, etc.)
4. **Logging**: Set up log aggregation
5. **Monitoring**: Implement application monitoring
6. **SSL**: Use HTTPS in production
7. **Backup**: Set up database backups

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For support, email support@msmeclinic.com or create an issue in the repository.
