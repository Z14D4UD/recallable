const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const AppleStrategy = require("passport-apple");
const User = require("../models/User");

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try { const u = await User.findById(id); done(null, u); }
  catch (e) { done(e); }
});

function upsertUser(profile, provider) {
  const data = {
    provider,
    providerId: profile.id || profile.sub,
    email: profile.emails?.[0]?.value || profile.email || undefined,
    firstName: profile.name?.givenName || profile.firstName || "",
    lastName: profile.name?.familyName || profile.lastName || "",
    avatar: profile.photos?.[0]?.value,
  };
  return User.findOneAndUpdate(
    { provider, providerId: data.providerId },
    { $setOnInsert: data },
    { new: true, upsert: true }
  );
}

// GOOGLE
if (process.env.GOOGLE_CLIENT_ID) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.SERVER_URL}/api/auth/google/callback`,
      },
      async (_a, _r, profile, done) => {
        try { const user = await upsertUser(profile, "google"); done(null, user); }
        catch (e) { done(e); }
      }
    )
  );
}

// APPLE
if (process.env.APPLE_CLIENT_ID) {
  passport.use(
    new AppleStrategy(
      {
        clientID: process.env.APPLE_CLIENT_ID,             // Service ID
        teamID: process.env.APPLE_TEAM_ID,
        keyID: process.env.APPLE_KEY_ID,
        callbackURL: `${process.env.SERVER_URL}/api/auth/apple/callback`,
        privateKeyString: (process.env.APPLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
        scope: ["name", "email"],
        passReqToCallback: false,
      },
      async (accessToken, refreshToken, idToken, profile, done) => {
        try {
          // passport-apple profile is a bit different; normalize
          const normalized = {
            id: profile.idToken?.sub || profile.id,
            emails: [{ value: profile.email }],
            name: {
              givenName: profile.name?.firstName,
              familyName: profile.name?.lastName,
            },
          };
          const user = await upsertUser(normalized, "apple");
          done(null, user);
        } catch (e) {
          done(e);
        }
      }
    )
  );
}

module.exports = passport;
