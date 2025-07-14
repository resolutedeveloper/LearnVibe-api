import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import User from '../models/user.model';

export const tokenVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ status: 'fail', message: 'Authorization token is required' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.decode(token) as JwtPayload;

    if (!decoded?._id) {
      res.status(401).json({ status: 'fail', message: 'Invalid token payload.' });
      return;
    }

    const user = await User.findOne({ _id: decoded._id });

    if (!user) {
      res.status(401).json({ status: 'fail', message: 'Invalid token or user not found.' });
      return;
    }

    req.TokenUser = user;
    next();
  } catch (error: any) {
    res.status(401).json({
      status: 'fail',
      message: error.message || 'Authentication failed.',
    });
  }
};
