const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri || typeof uri !== 'string') {
    console.error('❌ MONGO_URI is missing or not a string. Value:', uri);
    throw new Error('MONGO_URI is not defined');
  }
  console.log('Connecting to MongoDB…', uri.slice(0, 24) + '…');
  await mongoose.connect(uri);
  console.log('✅ Mongo connected');
}

module.exports = connectDB;
