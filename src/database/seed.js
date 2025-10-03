const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const { connectDB } = require('./connection');
const logger = require('../utils/logger');

const seedAdmin = async () => {
  try {
    // Connect to database
    await connectDB();

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@msmeclinic.com' });
    if (existingAdmin) {
      logger.info('Admin user already exists');
      return;
    }

    // Create default admin user
    const admin = new Admin({
      email: 'admin@msmeclinic.com',
      password: 'Admin123!@#', // Change this in production
      name: 'System Administrator',
      role: 'super_admin'
    });

    await admin.save();

    logger.info('Default admin user created successfully');
    logger.info('Email: admin@msmeclinic.com');
    logger.info('Password: Admin123!@#');
    logger.warn('Please change the default password after first login!');

  } catch (error) {
    logger.error('Error seeding admin user:', error);
    process.exit(1);
  }
};

// Run seed if this file is executed directly
if (require.main === module) {
  seedAdmin().then(() => {
    logger.info('Seeding completed');
    process.exit(0);
  });
}

module.exports = { seedAdmin };
