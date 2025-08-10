// server/routes/paymentRoutes.js

const express = require('express');
const router = express.Router();
const {
  createStripePayment,
  createPayPalOrder,
  capturePayPalOrder,
  simulateFakePayment
} = require('../controllers/paymentController');

// Real payment endpoints
router.post('/stripe', createStripePayment);
router.post('/paypal/create-order', createPayPalOrder);
router.post('/paypal/capture-order', capturePayPalOrder);

// ── NEW: simulate a fake payment for testing ───────────────────────────
router.post('/fake', simulateFakePayment);

module.exports = router;
