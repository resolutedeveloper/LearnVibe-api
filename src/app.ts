import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import userRoutes from './routes/index.routes';
import { connectDB } from './db/database';
import { DecryptFE, EncryptFE, EncryptBE, DecryptBE } from './utils/encrypt';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/v1', userRoutes);

// ✅ /encrypt-fe endpoint
app.post('/encrypt', (req: Request, res: Response): void => {
  const { text, mode } = req.body;

  if (typeof text !== 'string') {
    res.status(400).json({ error: 'Invalid or missing "text" field' });
    return;
  }

  try {
    let encrypted;
    if (mode === 'fe') {
      encrypted = EncryptFE(text);
    } else {
      encrypted = EncryptBE(text);
    }
    res.status(200).json({ encrypted });
    return;
  } catch (err) {
    res.status(500).json({ error: 'Encryption failed', details: (err as Error).message });
    return;
  }
});

// ✅ /decrypt-fe endpoint
app.post('/decrypt', (req: Request, res: Response): void => {
  const { encryptedText, mode } = req.body;

  if (typeof encryptedText !== 'string') {
    res.status(400).json({ error: 'Invalid or missing "encryptedText" field' });
    return;
  }

  try {
    let decrypted;
    if (mode === 'fe') {
      decrypted = DecryptFE(encryptedText);
    } else {
      decrypted = DecryptBE(encryptedText);
    }
    res.status(200).json({ decrypted });
    return;
  } catch (err) {
    res.status(500).json({ error: 'Decryption failed', details: (err as Error).message });
    return;
  }
});

const PORT = process.env.PORT || 8000;

app.use('/uploads', express.static('uploads'));

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🚀 Server running on port ${PORT}`);
  try {
    await connectDB();
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
  }
});
