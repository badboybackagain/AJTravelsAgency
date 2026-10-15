const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const {
  getSettings,
  updateSettings,
  handleVerifyConnection,
  handleTestMessage,
  toggleStatus,
  getLogs,
} = require('../controllers/whatsappController');

// All WhatsApp configuration endpoints require ADMIN authentication
router.use(auth, adminOnly);

router.get('/settings', getSettings);
router.put('/settings', updateSettings);
router.post('/verify', handleVerifyConnection);
router.post('/test', handleTestMessage);
router.patch('/toggle', toggleStatus);
router.get('/logs', getLogs);

module.exports = router;
