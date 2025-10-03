const mongoose = require('mongoose');
const Registration = require('./models/Registration');
const ContactMessage = require('./models/ContactMessage');
const { connectDB } = require('./connection');
const logger = require('../utils/logger');

const clearAllData = async () => {
  try {
    // Connect to database
    await connectDB();

    // Clear all registrations
    const registrationResult = await Registration.deleteMany({});
    logger.info(`Cleared ${registrationResult.deletedCount} registrations from database`);

    // Clear all contact messages
    const contactResult = await ContactMessage.deleteMany({});
    logger.info(`Cleared ${contactResult.deletedCount} contact messages from database`);

    logger.info('Database cleared successfully!');
    
    // Close connection
    await mongoose.connection.close();
    logger.info('Database connection closed');
    
  } catch (error) {
    logger.error('Error clearing database:', error);
    process.exit(1);
  }
};

// Run clear if this file is executed directly
if (require.main === module) {
  clearAllData().then(() => {
    logger.info('Data clearing completed');
    process.exit(0);
  });
}

module.exports = { clearAllData };
