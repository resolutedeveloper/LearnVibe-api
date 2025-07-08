import express from 'express';
import dotenv from 'dotenv';
import userRoutes from './routes/user.routes';

dotenv.config();

const app = express();
app.use(express.json());

app.use('/api/v1', userRoutes);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
