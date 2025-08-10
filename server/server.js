// server.js
// ─────────────────────────────────────────────────────────────────────────────
// 1) Load environment variables as early as possible
require('dotenv').config();
/* eslint-disable no-console */
const express       = require('express');
const cors          = require('cors');
const session       = require('express-session');
const passport      = require('passport');
const verifyRoutes  = require('./routes/verifyRoutes');

const path          = require('path');
const fs            = require('fs');
const FRONTEND_URL  = process.env.FRONTEND_URL?.replace(/\/$/, '');  
// remove trailing slash if any, e.g. "https://hyreuk.com/"
const http          = require('http');
const { Server }    = require('socket.io');
const connectDB     = require('./config/db');
const cookieParser  = require('cookie-parser');

               /* ─── ★ NEW: review-reminder cron deps ─── */
const cron          = require('node-cron');        // ★ NEW
const jwt           = require('jsonwebtoken');     // ★ NEW
const Booking       = require('./models/Booking'); // ★ NEW
const { sendReviewRequestEmail } = require('./utils/mailer'); // ★ NEW

const app    = express();
// ── CORS: allow React dev + your FRONTEND_URL ─────────────────────────
const devOrigin  = 'http://localhost:3000';
const prodOrigin = FRONTEND_URL;

app.use(cors({
  origin: [ devOrigin, prodOrigin ],
  credentials: true,
}));
// handle preflight for all routes
app.options('*', cors({
  origin: [ devOrigin, prodOrigin ],
  credentials: true,
}));

const server = http.createServer(app);

/* 1) DATABASE ---------------------------------------------------------------- */
connectDB();

/* 3) GLOBAL MIDDLEWARES ------------------------------------------------------- */
app.use(cookieParser());                      // must be before routes

app.use('/api', (_req, res, next) => {        // avoid stale JSON in browsers
  res.set('Cache-Control', 'no-store');
  next();
});
app.disable('etag');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* 4) STATIC UPLOADS ----------------------------------------------------------- */
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads',     express.static(uploadsDir));
app.use('/api/uploads', express.static(uploadsDir));

/* 5) SESSIONS & PASSPORT ------------------------------------------------------ */
app.use(session({
  secret: process.env.SESSION_SECRET || 'secretKey',
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());
require('./config/passport')(passport);

/* 6) ROUTES ------------------------------------------------------------------- */
app.use('/api/auth',            require('./routes/authRoutes'));
app.use('/api/bookings',        require('./routes/bookingRoutes'));
app.use('/api/invoices',        require('./routes/invoiceRoutes'));
app.use('/api/chat',            require('./routes/chatRoutes'));
app.use('/api/customer',        require('./routes/customerRoutes'));
app.use('/api/cars',            require('./routes/carRoutes'));
app.use('/api/business',        require('./routes/businessRoutes'));
app.use('/api/business',        require('./routes/listingRoutes'));
app.use('/api/listings',        require('./routes/publicListingRoutes'));
app.use('/api/payment',         require('./routes/paymentRoutes'));
app.use('/api/affiliate',       require('./routes/affiliateRoutes'));
app.use('/api/account',         require('./routes/accountRoutes'));
app.use('/api/support',         require('./routes/supportRoutes'));
app.use('/api/withdrawals',     require('./routes/withdrawalRoutes'));
app.use('/api/connect-bank',    require('./routes/connectBankRoutes'));
app.use('/api/reminders',       require('./routes/remindersRoutes'));
app.use('/api/reviews',         require('./routes/reviewRoutes'));
app.use('/api/admin',           require('./routes/adminRoutes'));
app.use('/api/public/business', require('./routes/publicBusinessRoutes'));
app.use('/api/favorites',       require('./routes/favoritesRoutes'));

// ★ NEW: mount the ID verification routes
app.use('/api', verifyRoutes);

/* 7) SOCKET.IO ---------------------------------------------------------------- */
const io = new Server(server, {
  cors: {
    origin: [ devOrigin, prodOrigin ],
    methods: ['GET','POST','PUT','DELETE','OPTIONS'],
    credentials: true
  }
});
io.on('connection', socket => {
  socket.on('joinRoom', room => socket.join(room));
  socket.on('sendMessage', data => io.to(data.room).emit('receiveMessage', data));
});

/* ──────────────────────────────────────────────────────────────────────────── */
/* ★ NEW – Cron job: send “leave a review” e-mails once a day at 02:00 UTC     */
/* ──────────────────────────────────────────────────────────────────────────── */
cron.schedule('0 2 * * *', async () => {
  try {
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);

    const bookings = await Booking.find({
      endDate: { $lte: yesterday },
      status:  'Active',
      reviewEmailSent: { $ne: true }
    }).populate('customer', 'email name');

    for (const b of bookings) {
      if (!b.customer?.email) continue;

      // link valid 14 days
      const token = jwt.sign(
        { bookingId: b._id, customerId: b.customer._id },
        process.env.JWT_SECRET,
        { expiresIn: '14d' }
      );
      const url = `${process.env.FRONTEND_URL}/review/${b._id}?token=${token}`;

      await sendReviewRequestEmail({
        customerEmail: b.customer.email,
        customerName:  b.customer.name || 'Customer',
        reviewUrl:     url
      });

      b.reviewEmailSent = true;
      await b.save();
    }
    console.log(`✓ review-reminder cron sent ${bookings.length} e-mails`);
  } catch (err) {
    console.error('review-reminder cron error:', err);
  }
});

cron.schedule('0 0 * * *', async () => {
  try {
    const today = new Date();
    const bookings = await Booking.find({
      startDate: { $lte: today },
      released:  false
    });
    let total = 0;
    for (const b of bookings) {
      total += b.payout || 0;
      b.released = true;
      await b.save();
    }
    if (total > 0) {
      const Business = require('./models/Business');
      const bizUpdates = bookings.reduce((acc, b) => {
        acc[b.business] = (acc[b.business]||0) + b.payout;
        return acc;
      }, {});
      for (let [bizId, amt] of Object.entries(bizUpdates)) {
        await Business.findByIdAndUpdate(bizId, {
          $inc: { balance: amt, pendingBalance: -amt }
        });
      }
      console.log(`Auto-released £${total} to businesses for started bookings.`);
    }
  } catch (err) {
    console.error('Cron release-payouts error:', err);
  }
});

/* 8) START -------------------------------------------------------------------- */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`► API up on :${PORT}`));
