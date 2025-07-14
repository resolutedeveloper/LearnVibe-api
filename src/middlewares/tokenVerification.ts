import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import User from '../models/user.model';

export const tokenVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ status: 'fail', message: 'Authorization token is required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.decode(token) as JwtPayload;

    if (!decoded?._id) {
      return res.status(401).json({ status: 'fail', message: 'Invalid token payload.' });
    }

    const user = await User.findOne({ _id: decoded._id });

    if (!user) {
      return res.status(401).json({ status: 'fail', message: 'Invalid token or user not found.' });
    }

    req.TokenUser! = user;
    next();
  } catch (error: any) {
    res.status(401).json({
      status: 'fail',
      message: error.message || 'Authentication failed.',
    });
  }
};
