// server/controllers/reviewController.js

const Review   = require('../models/Review');
const Booking  = require('../models/Booking');

/**
 * GET /api/reviews
 * Returns all reviews written by the authenticated customer.
 * (Needed so GET /api/reviews no longer 404s)
 */
exports.getReviewsForCustomer = async (req, res) => {
  try {
    const reviews = await Review.find({ client: req.customer.id })
      .populate('business', 'name avatarUrl')
      .sort({ createdAt: -1 })
      .lean();
    return res.json(reviews);
  } catch (err) {
    console.error('FETCH customer reviews err:', err);
    return res.status(500).json({ msg: 'Server error fetching customer reviews' });
  }
};

/* ────────────────────────────────────────────────────────────── */
/*  POST /api/reviews – create review & flag booking             */
/* ────────────────────────────────────────────────────────────── */
exports.createReview = async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;

    // 1) load booking to get business and verify ownership
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }
    if (booking.customer.toString() !== req.customer.id) {
      return res.status(403).json({ msg: 'Not your booking' });
    }
    if (booking.hasReview) {
      return res.status(400).json({ msg: 'Review already exists' });
    }

    // 2) create review
    const review = await Review.create({
      business: booking.business,
      client:   req.customer.id,
      listing:  booking.car,
      rating,
      comment
    });

    // 3) mark booking as reviewed
    booking.hasReview = true;
    await booking.save();

    return res.status(201).json(review);
  } catch (err) {
    console.error('CREATE review err:', err);
    return res.status(500).json({ msg: 'Server error creating review' });
  }
};
