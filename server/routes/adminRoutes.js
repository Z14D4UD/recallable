// server/routes/adminRoutes.js
const express           = require('express');
const router            = express.Router();
const authMiddleware    = require('../middlewares/authMiddleware');
const adminMiddleware   = require('../middlewares/adminMiddleware');
const {
  getStats,
  getBusinesses,
  withdrawPlatformFees
} = require('../controllers/adminController');

router.get(
  '/stats',
  authMiddleware,
  adminMiddleware,
  getStats
);

router.get(
  '/businesses',
  authMiddleware,
  adminMiddleware,
  getBusinesses
);

router.post(
  '/withdraw',
  authMiddleware,
  adminMiddleware,
  withdrawPlatformFees
);

module.exports = router;
