const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '.env'), // force server/.env
  debug: true, // logs what dotenv is doing
});


const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Quick sanity check (remove after it works)
console.log('MONGO_URI loaded?', Boolean(process.env.MONGO_URI));

connectDB();

app.get('/', (req, res) => res.json({ message: 'Recallable API is running' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
