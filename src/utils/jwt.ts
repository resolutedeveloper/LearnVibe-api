import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const generateToken = (userId: string): string => {
  return jwt.sign({ _id: userId }, process.env.JWT_SECRET!, { expiresIn: '1d' });
};
