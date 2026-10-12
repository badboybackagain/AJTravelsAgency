const express = require('express');
const router = express.Router();
const { login, register, registerCustomer, me } = require('../controllers/authController');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/signup & /register-customer
router.post('/signup', registerCustomer);
router.post('/register-customer', registerCustomer);

// POST /api/auth/register — Admin creates other users
router.post('/register', auth, adminOnly, register);

// GET /api/auth/me
router.get('/me', auth, me);

module.exports = router;
