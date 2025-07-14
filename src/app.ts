import express from 'express';
import dotenv from 'dotenv';
import userRoutes from './routes/index.routes';
import { connectDB } from './db/database';
import { DecryptFE, EncryptFE, EncryptBE, DecryptBE } from './utils/encrypt';
import type { Request, Response } from 'express';

dotenv.config();

const app = express();
app.use(express.json());

app.use('/api/v1', userRoutes);

// ✅ /encrypt-fe endpoint
app.post('/encrypt', (req: Request, res: Response) => {
  const { text, mode } = req.body;

  if (typeof text !== 'string') {
    return res.status(400).json({ error: 'Invalid or missing "text" field' });
  }

  try {
    let encrypted;
    if (mode === 'fe') {
      encrypted = EncryptFE(text);
    } else {
      encrypted = EncryptBE(text);
    }
    return res.status(200).json({ encrypted });
  } catch (err) {
    return res.status(500).json({ error: 'Encryption failed', details: (err as Error).message });
  }
});

// ✅ /decrypt-fe endpoint
app.post('/decrypt', (req: Request, res: Response) => {
  const { encryptedText, mode } = req.body;

  if (typeof encryptedText !== 'string') {
    return res.status(400).json({ error: 'Invalid or missing "encryptedText" field' });
  }

  try {
    let decrypted;
    if (mode === 'fe') {
      decrypted = DecryptFE(encryptedText);
    } else {
      decrypted = DecryptBE(encryptedText);
    }
    return res.status(200).json({ decrypted });
  } catch (err) {
    return res.status(500).json({ error: 'Decryption failed', details: (err as Error).message });
  }
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);

  try {
    await connectDB();
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
  }
});
