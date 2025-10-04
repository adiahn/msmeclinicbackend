const mongoose = require('mongoose');
const logger = require('../utils/logger');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }

  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      isConnected = true;
      return;
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    logger.info(`MongoDB Connected: ${conn.connection.host}`);

  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
};

module.exports = { connectDB };
