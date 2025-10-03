const express = require('express');
const router = express.Router();
const Admin = require('../database/models/Admin');
const { adminLoginSchema, adminRegistrationSchema, validate } = require('../utils/validation');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { authenticateToken, generateToken, generateRefreshToken, verifyRefreshToken } = require('../middleware/auth');
const logger = require('../utils/logger');

// POST /api/auth/admin/login - Admin login
router.post('/admin/login',
  validate(adminLoginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find admin and include password for comparison
    const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!admin || !admin.isActive) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Check password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate tokens
    const token = generateToken(admin._id);
    const refreshToken = generateRefreshToken(admin._id);

    // Save refresh token
    await admin.addRefreshToken(refreshToken);

    logger.info(`Admin ${admin.email} logged in successfully`);

    res.json({
      success: true,
      data: {
        token,
        refreshToken,
        admin: {
          id: admin._id,
          email: admin.email,
          name: admin.name,
          role: admin.role
        }
      }
    });
  })
);

// POST /api/auth/admin/logout - Admin logout
router.post('/admin/logout',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Remove refresh token from admin's list
      await req.admin.removeRefreshToken(refreshToken);
    }

    logger.info(`Admin ${req.admin.email} logged out`);

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  })
);

// POST /api/auth/refresh - Refresh token
router.post('/refresh',
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400, 'VALIDATION_ERROR');
    }

    try {
      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);
      
      // Find admin and check if refresh token exists
      const admin = await Admin.findById(decoded.adminId);
      if (!admin || !admin.isActive) {
        throw new AppError('Invalid refresh token', 401, 'UNAUTHORIZED');
      }

      const tokenExists = admin.refreshTokens.some(t => t.token === refreshToken);
      if (!tokenExists) {
        throw new AppError('Invalid refresh token', 401, 'UNAUTHORIZED');
      }

      // Generate new access token
      const newToken = generateToken(admin._id);

      logger.info(`Token refreshed for admin ${admin.email}`);

      res.json({
        success: true,
        data: {
          token: newToken
        }
      });
    } catch (error) {
      throw new AppError('Invalid refresh token', 401, 'UNAUTHORIZED');
    }
  })
);

// POST /api/auth/admin/register - Register new admin (super admin only)
router.post('/admin/register',
  authenticateToken,
  validate(adminRegistrationSchema),
  asyncHandler(async (req, res) => {
    // Check if current admin is super admin
    if (req.admin.role !== 'super_admin') {
      throw new AppError('Only super admins can register new admins', 403, 'FORBIDDEN');
    }

    const { email, password, name, role } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      throw new AppError('Admin with this email already exists', 400, 'DUPLICATE_EMAIL');
    }

    // Create new admin
    const admin = new Admin({
      email: email.toLowerCase(),
      password,
      name,
      role: role || 'admin'
    });

    await admin.save();

    logger.info(`New admin registered: ${admin.email} by ${req.admin.email}`);

    res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      data: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    });
  })
);

// GET /api/auth/me - Get current admin info
router.get('/me',
  authenticateToken,
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: {
        id: req.admin._id,
        email: req.admin.email,
        name: req.admin.name,
        role: req.admin.role,
        lastLogin: req.admin.lastLogin,
        createdAt: req.admin.createdAt
      }
    });
  })
);

// POST /api/auth/change-password - Change admin password
router.post('/change-password',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError('Current password and new password are required', 400, 'VALIDATION_ERROR');
    }

    if (newPassword.length < 8) {
      throw new AppError('New password must be at least 8 characters long', 400, 'VALIDATION_ERROR');
    }

    // Get admin with password
    const admin = await Admin.findById(req.admin._id).select('+password');

    // Verify current password
    const isCurrentPasswordValid = await admin.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new AppError('Current password is incorrect', 400, 'INVALID_CREDENTIALS');
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    logger.info(`Password changed for admin ${admin.email}`);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  })
);

module.exports = router;