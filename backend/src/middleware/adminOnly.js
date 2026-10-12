// Admin-only route guard
// Must be used AFTER auth middleware

const { AppError } = require('./errorHandler');

const adminOnly = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required.', 401));
  }
  if (req.user.role !== 'ADMIN') {
    return next(new AppError('Access denied. Admin privileges required.', 403));
  }
  next();
};

module.exports = adminOnly;
