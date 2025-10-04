const logger = require('../utils/logger');

// Timeout middleware to prevent long-running requests
const timeout = (timeoutMs = 15000) => {
  return (req, res, next) => {
    // Set timeout for the request
    const timeoutId = setTimeout(() => {
      if (!res.headersSent) {
        logger.error(`Request timeout after ${timeoutMs}ms for ${req.method} ${req.originalUrl}`);
        res.status(408).json({
          success: false,
          error: {
            code: 'REQUEST_TIMEOUT',
            message: 'Request timeout - please try again',
            details: `Request took longer than ${timeoutMs}ms to process`
          }
        });
      }
    }, timeoutMs);

    // Clear timeout when response is sent
    res.on('finish', () => {
      clearTimeout(timeoutId);
    });

    res.on('close', () => {
      clearTimeout(timeoutId);
    });

    next();
  };
};

module.exports = timeout;
