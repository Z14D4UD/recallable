require("dotenv").config();
const express = require("express");
const session = require("express-session");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");

// IMPORTANT: requiring config/passport sets up the Google strategy
const passport = require("./config/passport");

const app = express();

// ---- DB ----
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/recallable";
mongoose.set("strictQuery", true);
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("Mongo connected"))
  .catch(console.error);

// ---- Core middleware ----
app.use(express.json());
app.use(cookieParser());

// Frontend is the React dev server on :3000 in dev
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

app.set("trust proxy", 1);
app.use(
  session({
    name: "sid",
    secret: process.env.SESSION_SECRET || "devsecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // set true when behind HTTPS in prod
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

// ---- Passport ----
app.use(passport.initialize());
app.use(passport.session()); // requires serialize/deserialize in config/passport

// ---- Routes ----
app.use("/api/auth", require("./routes/auth"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API running on :${PORT}`));
