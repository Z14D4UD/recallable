// server/controllers/authController.js
/* eslint-disable no-console */

const Business  = require('../models/Business');
const Customer  = require('../models/Customer');
const Affiliate = require('../models/Affiliate');
const Admin     = require('../models/Admin');
const jwt       = require('jsonwebtoken');
const bcrypt    = require('bcryptjs');
const crypto    = require('crypto');
const sendEmail = require('../utils/sendEmail');

/* ────────────────────────────────────────────────────────────── */
/*  ▲▲ Fail-fast if secrets are missing                           */
/* ────────────────────────────────────────────────────────────── */
['JWT_SECRET', 'JWT_REFRESH_SECRET'].forEach(key => {
  if (!process.env[key]) {
    console.error(`FATAL: ${key} environment variable is missing`);
    process.exit(1);
  }
});

/* ────────────────────────────────────────────────────────────── */
/*  CONSTANTS                                                    */
/* ────────────────────────────────────────────────────────────── */
const ACCESS_TTL  = '1h';    // short-lived access token
const REFRESH_TTL = '30d';   // long-lived refresh token

/* ────────────────────────────────────────────────────────────── */
/*  HELPERS                                                      */
/* ────────────────────────────────────────────────────────────── */
const generateToken = () => crypto.randomBytes(20).toString('hex');

/* issue both tokens + set secure http-only cookie  */
const issueTokens = (payload, res) => {
  const accessToken  = jwt.sign(payload, process.env.JWT_SECRET,         { expiresIn: ACCESS_TTL  });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TTL });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    sameSite: 'strict',
    secure:   process.env.NODE_ENV === 'production',
    maxAge:   30 * 24 * 60 * 60 * 1000        // 30 days
  });

  return accessToken;
};

/* ────────────────────────────────────────────────────────────── */
/*  SIGN-UP                                                      */
/* ────────────────────────────────────────────────────────────── */
const signup = async (req, res) => {
  const {
    name,
    email,
    password,
    accountType,
    dateOfBirth,    // newly captured from client
    acceptTerms     // newly captured from client
  } = req.body;

  // NEW: enforce terms acceptance
  if (!acceptTerms) {
    return res.status(400).json({ msg: 'Please accept the terms and policies' });
  }

  try {
    /* ───────────── BUSINESS ───────────── */
    if (accountType === 'business') {
      let business = await Business.findOne({ email });
      if (business) return res.status(400).json({ msg: 'Business already exists' });

      const salt           = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const emailToken     = generateToken();

      business = new Business({
        name,
        email,
        password: hashedPassword,
        emailConfirmationToken: emailToken
      });
      await business.save();

      const confirmUrl = `${process.env.FRONTEND_URL}/confirm/${emailToken}`;
      sendEmail({
        email:   business.email,
        subject: 'Hyre Account Confirmation',
        message: `Please confirm your email by clicking this link: ${confirmUrl}`
      }).catch(console.error);

      const accessToken = issueTokens(
        { id: business._id, accountType: 'business' },
        res
      );

      return res.json({
        token: accessToken,
        business,
        msg: 'Signup successful. Please check your email to confirm your account.',
        redirectUrl: '/dashboard/business'
      });
    }

    /* ───────────── CUSTOMER ───────────── */
    if (accountType === 'customer') {
      // ensure dateOfBirth provided
      if (!dateOfBirth) {
        return res.status(400).json({ msg: 'Date of birth is required for customers.' });
      }

      let customer = await Customer.findOne({ email });
      if (customer) return res.status(400).json({ msg: 'Customer already exists' });

      const salt           = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // include dateOfBirth in new Customer
      customer = new Customer({
        name,
        email,
        password:    hashedPassword,
        dateOfBirth // saved to profile
      });
      await customer.save();

      const accessToken = issueTokens(
        { id: customer._id, accountType: 'customer' },
        res
      );

      return res.json({
        token: accessToken,
        customer,
        msg: 'Customer signup successful.',
        redirectUrl: '/account'
      });
    }

    /* ───────────── AFFILIATE ───────────── */
    if (accountType === 'affiliate') {
      let affiliate = await Affiliate.findOne({ email });
      if (affiliate) return res.status(400).json({ msg: 'Affiliate already exists' });

      const salt           = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const affiliateCode  = crypto.randomBytes(4).toString('hex').toUpperCase();

      affiliate = new Affiliate({
        name,
        email,
        password:      hashedPassword,
        affiliateCode
      });
      await affiliate.save();

      const accessToken = issueTokens(
        { id: affiliate._id, accountType: 'affiliate' },
        res
      );

      return res.json({
        token: accessToken,
        affiliate,
        msg: 'Affiliate signup successful.',
        redirectUrl: '/dashboard/affiliate'
      });
    }

    return res.status(400).json({ msg: 'Invalid account type' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};

/* ────────────────────────────────────────────────────────────── */
/*  LOGIN                                                        */
/* ────────────────────────────────────────────────────────────── */
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    let user        = null;
    let accountType = '';

    /* 1) Admin */
    user = await Admin.findOne({ email });
    if (user) accountType = 'admin';

    /* 2) Business */
    if (!user) {
      user = await Business.findOne({ email });
      if (user) accountType = 'business';
    }

    /* 3) Customer */
    if (!user) {
      user = await Customer.findOne({ email });
      if (user) accountType = 'customer';
    }

    /* 4) Affiliate */
    if (!user) {
      user = await Affiliate.findOne({ email });
      if (user) accountType = 'affiliate';
    }

    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    const accessToken = issueTokens(
      { id: user._id, accountType },
      res
    );

    let redirectUrl = '/dashboard';
    if (accountType === 'admin')          redirectUrl = '/dashboard/admin';
    else if (accountType === 'business')  redirectUrl = '/dashboard/business';
    else if (accountType === 'customer')  redirectUrl = '/';
    else if (accountType === 'affiliate') redirectUrl = '/dashboard/affiliate';

    return res.json({ token: accessToken, user, accountType, redirectUrl });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};

/* ────────────────────────────────────────────────────────────── */
/*  REFRESH ACCESS TOKEN                                         */
/* ────────────────────────────────────────────────────────────── */
const refresh = (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ msg: 'No refresh token' });

  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const accessToken = jwt.sign(
      { id: payload.id, accountType: payload.accountType },
      process.env.JWT_SECRET,
      { expiresIn: ACCESS_TTL }
    );
    return res.json({ accessToken });
  } catch (err) {
    return res.status(401).json({ msg: 'Invalid refresh token' });
  }
};

/* ────────────────────────────────────────────────────────────── */
/*  CONFIRM-EMAIL                                                */
/* ────────────────────────────────────────────────────────────── */
const confirmEmail = async (req, res) => {
  /* unchanged … */
};

/* ────────────────────────────────────────────────────────────── */
/*  PLACE-HOLDERS                                                */
/* ────────────────────────────────────────────────────────────── */
const forgotPassword = async (_req, res) => res.json({ msg: 'forgotPassword not implemented yet.' });
const resetPassword  = async (_req, res) => res.json({ msg: 'resetPassword not implemented yet.' });
const googleCallback = (_req, res) =>    res.json({ msg: 'googleCallback not implemented yet.' });

module.exports = {
  signup,
  login,
  refresh,
  confirmEmail,
  forgotPassword,
  resetPassword,
  googleCallback
};
