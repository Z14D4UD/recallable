const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const {
  getAffiliateStats,
  getAffiliateProfile,
  updateAffiliateProfile,
  recordAffiliateVisit            // ← import the new handler
} = require('../controllers/affiliateController');

// GET /api/affiliate/stats
router.get('/stats', authMiddleware, getAffiliateStats);

// GET /api/affiliate/me
router.get('/me', authMiddleware, getAffiliateProfile);

// PUT /api/affiliate/me
router.put('/me', authMiddleware, upload.single('avatar'), updateAffiliateProfile);

// POST /api/affiliate/visit
// (no auth — called from your public landing page when someone clicks a link)
router.post('/visit', recordAffiliateVisit);

module.exports = router;
