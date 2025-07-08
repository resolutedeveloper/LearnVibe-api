import { Request, Response } from 'express';
import { connectDB } from '../db/database';
import { Subscription } from '../models/subscription.model';
import { DataEncrypted } from '../utils/encrypt';

// Call DB connection (optional if you already call it elsewhere in app.ts/server.ts)
connectDB();

export const plan_list = async (req: Request, res: Response) => {
  try {
    // Fetch subscriptions from MongoDB
    const subscriptions = await Subscription.find({ IsActive: true }).sort({ CreatedOn: -1 });

    // If no subscriptions found
    if (!subscriptions || subscriptions.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No subscription plans found.'
      });
    }

    // Encrypt data
   
    // Success response
    return res.status(200).json({
      status: 'success',
      message: 'Subscription plans retrieved successfully.',
      data: subscriptions
    });

  } catch (error) {
    console.error('❌ Error fetching subscriptions:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error.',
      error: error instanceof Error ? error.message : error
    });
  }
};
