import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI!;
const DB_NAME = process.env.DB_NAME!;

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      dbName: DB_NAME,
    });
    console.log(`✅ MongoDB connected to ${DB_NAME}`);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
};
