// Auth Controller — Login + Admin Registration
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

// Zod validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['ADMIN', 'CUSTOMER']).default('CUSTOMER'),
});

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new AppError(parsed.error.errors[0].message, 422));
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      return next(new AppError('Invalid email or password.', 401));
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return next(new AppError('Invalid email or password.', 401));
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/register — Admin only (creates new user)
 */
const register = async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new AppError(parsed.error.errors[0].message, 422));
    }

    const { email, password, role } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return next(new AppError('A user with this email already exists.', 409));
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { email, passwordHash, role },
      select: { id: true, email: true, role: true, createdAt: true }
    });

    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me — Get current user info
 */
const me = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, email: true, role: true, createdAt: true }
    });
    if (!user) {
      return next(new AppError('User not found.', 404));
    }
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/signup — Public Customer Registration
 */
const registerCustomer = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Email and Password are required.', 400));
    }

    if (password.length < 6) {
      return next(new AppError('Password must be at least 6 characters long.', 400));
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return next(new AppError('An account with this email address already exists. Please login.', 409));
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'CUSTOMER',
      },
      select: { id: true, email: true, role: true, createdAt: true }
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: name || user.email.split('@')[0],
          phone: phone || '',
          role: user.role,
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, register, registerCustomer, me };
