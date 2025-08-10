// server/routes/reviewRoutes.js

const express = require('express');
const router  = express.Router();
const auth    = require('../middlewares/authMiddleware');
const ctl     = require('../controllers/reviewController');
const Review  = require('../models/Review');

// GET all reviews by this customer (so GET /api/reviews works)
router.get('/', auth, ctl.getReviewsForCustomer);

// POST to create a new review
router.post('/', auth, ctl.createReview);

// GET all reviews for a specific listing (car)
router.get('/listing/:id', async (req, res) => {
  try {
    const reviews = await Review.find({ listing: req.params.id })
      .populate('client', 'name avatarUrl')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error('Error fetching listing reviews:', err);
    res.status(500).json({ msg: 'Failed to fetch listing reviews' });
  }
});

// (You can keep your existing listing-specific or business/customer endpoints below)

module.exports = router;
