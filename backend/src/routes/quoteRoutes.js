const express = require('express');
const router = express.Router();
const {
  getPublicQuoteByToken,
  acceptQuote,
  declineQuote,
} = require('../controllers/quoteController');

// PUBLIC — Customer view quote
router.get('/:token', getPublicQuoteByToken);

// PUBLIC — Customer accept quote
router.post('/:token/accept', acceptQuote);

// PUBLIC — Customer decline quote
router.post('/:token/decline', declineQuote);

module.exports = router;
