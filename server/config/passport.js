const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try { done(null, await User.findById(id).lean()); }
  catch (err) { done(err); }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Works in dev and prod because it’s relative to your API host
      callbackURL: "/api/auth/google/callback",
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error("No email on Google account"));

        let user = await User.findOne({ email });

        if (!user) {
          user = await User.create({
            email,
            firstName: profile.name?.givenName || "",
            lastName: profile.name?.familyName || "",
            provider: "google",
            providerId: profile.id,                 // ← use providerId (matches schema)
            avatar: profile.photos?.[0]?.value,
          });
        } else if (!user.providerId) {
          // Link Google to an existing email account
          user.provider = "google";
          user.providerId = profile.id;            // ← use providerId
          user.avatar = user.avatar || profile.photos?.[0]?.value;
          await user.save();
        }

        return done(null, user);
      } catch (err) {
        done(err);
      }
    }
  )
);

module.exports = passport;
