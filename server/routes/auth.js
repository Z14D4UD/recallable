const express = require("express");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const User = require("../models/User");

const router = express.Router();
const CLIENT_URL = process.env.FRONTEND_URL || "http://localhost:3000";

function setJwtCookie(res, user) {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "devjwt", {
    expiresIn: "7d",
  });
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

/** Email “continue” flow (your existing form) */
router.post("/email-signup", async (req, res) => {
  try {
    const { firstName = "", lastName = "", email } = req.body || {};
    if (!email) return res.status(400).json({ error: "Email is required" });

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ email, firstName, lastName, provider: "email" });
    }

    setJwtCookie(res, user);
    res.json({ ok: true, user: { id: user._id, email: user.email } });
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to create account" });
  }
});

/** Google OAuth */
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${CLIENT_URL}/login?error=google`,
    session: true, // using express-session
  }),
  (req, res) => {
    // Optionally mint our JWT too
    if (req.user) setJwtCookie(res, req.user);
    res.redirect(CLIENT_URL);
  }
);

module.exports = router;
