// Central error handler middleware
// Returns consistent JSON error responses, hides stack trace in production

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isDev = process.env.NODE_ENV === 'development';

  // Log for server debugging
  if (statusCode >= 500) {
    console.error(`[ERROR] ${err.message}`, isDev ? err.stack : '');
  }

  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    // Only expose stack trace in development
    ...(isDev && statusCode >= 500 && { stack: err.stack })
  });
};

// Custom error class with HTTP status code
class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

module.exports = { errorHandler, AppError };
