import express from 'express';
import dotenv from 'dotenv';
import userRoutes from './routes/user.routes';
import { connectDB } from './db/database';

dotenv.config();

const app = express();
app.use(express.json());

app.use('/api/v1', userRoutes);

const PORT = process.env.PORT || 8000;

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);

  try {
    await connectDB();
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
  }
});
