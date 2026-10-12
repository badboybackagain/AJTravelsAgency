// Request validation middleware using Zod
// Usage: validate(schema) — wraps a Zod schema to validate req.body

const { AppError } = require('./errorHandler');

const validate = (schema) => (req, res, next) => {
  try {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const firstError = result.error.errors[0];
      const message = `${firstError.path.join('.')}: ${firstError.message}`;
      return next(new AppError(message, 422));
    }
    // Replace req.body with validated + transformed data
    req.body = result.data;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = validate;
