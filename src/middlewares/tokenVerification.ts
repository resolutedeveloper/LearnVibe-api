import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { User } from '../models/user.model';
import mongoose from 'mongoose';

interface AuthenticatedRequest extends Request {
  requestor?: any;  // You can replace `any` with the actual User type
}

export const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        status: 'fail',
        message: 'Authorization token is required',
      });
      return;
    }

    if (!authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        status: 'fail',
        message: 'Bearer token is required',
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const secretKey = process.env.Encrypted_S_Key;

    if (!secretKey) {
      res.status(500).json({
        status: 'fail',
        message: 'Server configuration error: Missing secret key.',
      });
      return;
    }

    const decoded = jwt.verify(token, secretKey) as JwtPayload;

    if (!decoded?._id || !mongoose.Types.ObjectId.isValid(decoded._id)) {
      res.status(401).json({
        status: 'fail',
        message: 'Invalid token payload.',
      });
      return;
    }

    const user = await User.findOne({ _id: decoded._id, IsActive: true, IsDeleted: false });

    if (!user) {
      res.status(401).json({
        status: 'fail',
        message: 'Invalid token or user not found.',
      });
      return;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < currentTime) {
      res.status(401).json({
        status: 'fail',
        message: 'Token expired. Please log in again.',
      });
      return;
    }

    req.requestor = user;
    next();

  } catch (error: any) {
    console.error('❌ Authentication Error:', error);
    res.status(401).json({
      status: 'fail',
      message: error.message || 'An error occurred while verifying the token.',
    });
  }
};
