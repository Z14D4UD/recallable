const express           = require('express');
const router            = express.Router();
const authMiddleware    = require('../middlewares/authMiddleware');
const requireIdVerified = require('../middlewares/requireIdVerified');
const upload            = require('../middlewares/uploadMiddleware');

const {
  createBooking,
  requestPayout,
  getBookings,
  getMyBookings,
  getCustomerBookings,
  getBookingById,
  generateInvoice,
  updateBookingStatus,
  requestBookingCancel
} = require('../controllers/bookingController');

const { deleteBooking }      = require('../controllers/deleteBookingController');
const { getPending, handle } = require('../controllers/refundRequestController');

// Customer requests a cancellation
router.patch('/:id/cancel', authMiddleware, requestBookingCancel);

// Business fetches all pending refunds/cancellations
router.get('/refunds', authMiddleware, getPending);
router.patch('/refunds/:reqId', authMiddleware, handle);

// ← Booking creation must be authenticated, ID‐verified, & include licence upload
router.post(
  '/',
  authMiddleware,
  requireIdVerified,
  upload.single('license'),
  createBooking
);

// Public booking list
router.get('/', getBookings);

// Download invoice PDF
router.get('/invoice/:id', authMiddleware, generateInvoice);

// Payout request
router.post('/payout', authMiddleware, requestPayout);

// “My” routes
router.get('/my', authMiddleware, getMyBookings);
router.get('/customer', authMiddleware, getCustomerBookings);

// Single booking
router.get('/:id', authMiddleware, getBookingById);

// Update booking status (approve/reject)
router.patch('/:id/status', authMiddleware, updateBookingStatus);

// Delete booking
router.delete('/:id', authMiddleware, deleteBooking);

// Duplicate cancel (harmless)
router.patch('/:id/cancel', authMiddleware, requestBookingCancel);

module.exports = router;
