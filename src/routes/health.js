const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const logger = require('../utils/logger');

// GET /api/health - Health check endpoint
router.get('/', async (req, res) => {
  try {
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      services: {}
    };

    // Check database connection
    try {
      if (mongoose.connection.readyState === 1) {
        healthCheck.services.database = 'connected';
      } else {
        healthCheck.services.database = 'disconnected';
        healthCheck.status = 'unhealthy';
      }
    } catch (error) {
      healthCheck.services.database = 'error';
      healthCheck.status = 'unhealthy';
    }


    // Check memory usage
    const memoryUsage = process.memoryUsage();
    healthCheck.memory = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      external: Math.round(memoryUsage.external / 1024 / 1024) // MB
    };

    // Check CPU usage
    const cpuUsage = process.cpuUsage();
    healthCheck.cpu = {
      user: cpuUsage.user,
      system: cpuUsage.system
    };

    const statusCode = healthCheck.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthCheck);

  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

// GET /api/health/detailed - Detailed health check (admin only)
router.get('/detailed', async (req, res) => {
  try {
    const detailedHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      services: {},
      system: {}
    };

    // Database detailed check
    try {
      if (mongoose.connection.readyState === 1) {
        const dbStats = await mongoose.connection.db.stats();
        detailedHealth.services.database = {
          status: 'connected',
          host: mongoose.connection.host,
          port: mongoose.connection.port,
          name: mongoose.connection.name,
          collections: dbStats.collections,
          dataSize: Math.round(dbStats.dataSize / 1024 / 1024), // MB
          storageSize: Math.round(dbStats.storageSize / 1024 / 1024), // MB
          indexes: dbStats.indexes
        };
      } else {
        detailedHealth.services.database = {
          status: 'disconnected',
          readyState: mongoose.connection.readyState
        };
        detailedHealth.status = 'unhealthy';
      }
    } catch (error) {
      detailedHealth.services.database = {
        status: 'error',
        error: error.message
      };
      detailedHealth.status = 'unhealthy';
    }


    // System information
    detailedHealth.system = {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      pid: process.pid,
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      loadAverage: process.platform !== 'win32' ? require('os').loadavg() : null
    };

    // Environment variables check
    const requiredEnvVars = [
      'MONGODB_URI',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET'
    ];

    detailedHealth.environment = {
      variables: requiredEnvVars.map(varName => ({
        name: varName,
        configured: !!process.env[varName]
      }))
    };

    const statusCode = detailedHealth.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(detailedHealth);

  } catch (error) {
    logger.error('Detailed health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Detailed health check failed'
    });
  }
});

module.exports = router;
