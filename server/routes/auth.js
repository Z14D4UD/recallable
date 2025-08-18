const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/User");

// --- Email lightweight signup (no password, demo-friendly) ---
router.post("/email-signup", async (req, res) => {
  const { firstName, lastName, email } = req.body || {};
  if (!email) return res.status(400).json({ error: "Email required" });
  try {
    // Create or reuse minimal local user
    let user = await User.findOne({ provider: "email", email });
    if (!user) user = await User.create({ provider: "email", email, firstName, lastName });
    req.login(user, (err) => {
      if (err) return res.status(500).json({ error: "Login failed" });
      return res.json({ ok: true, user });
    });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// --- Google OAuth ---
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: `${process.env.FRONTEND_URL}/login` }),
  (req, res) => res.redirect(process.env.FRONTEND_URL || "/")
);

// --- Apple OAuth ---
router.get("/apple", passport.authenticate("apple"));
router.post(
  "/apple/callback",
  passport.authenticate("apple", { failureRedirect: `${process.env.FRONTEND_URL}/login` }),
  (req, res) => res.redirect(process.env.FRONTEND_URL || "/")
);

// Session helpers
router.get("/me", (req, res) => res.json({ user: req.user || null }));
router.post("/logout", (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    req.session.destroy(() => res.clearCookie("sid").json({ ok: true }));
  });
});

module.exports = router;
