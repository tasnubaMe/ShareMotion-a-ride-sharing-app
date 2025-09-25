// server/src/config/database.js
const path     = require('path');
const dotenv   = require('dotenv');
const mongoose = require('mongoose');

// 1. Explicitly point dotenv at your .env
const envPath = path.resolve(__dirname, '../../.env');
const result  = dotenv.config({ path: envPath });

// 2. Debug output
console.log('→ Loading .env from:', envPath);
if (result.error) {
  console.error('⚠️ dotenv failed to load .env:', result.error);
} else {
  console.log('✔️ dotenv loaded keys:', Object.keys(result.parsed));
}
console.log('→ process.cwd():', process.cwd());
console.log('→ process.env.MONGO_URI:', process.env.MONGO_URI);

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('❌ MONGO_URI is undefined. Check that your .env file has "MONGO_URI=..."');
  process.exit(1);
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(uri, {
      useNewUrlParser:    true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
