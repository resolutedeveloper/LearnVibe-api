import { Request, Response } from 'express';
import { Subscription } from '../models/subscription.model';

export const plan_list = async (req: Request, res: Response) => {
  try {
    // Fetch only active subscriptions and select specific fields
    const subscriptions = await Subscription.find(
      { IsActive: true },{
        ID: 1,
        SubscriptionTitle: 1,
        Duration: 1,
        NumOfDocuments: 1,
        NoOfPages: 1,
        NumOfQuiz: 1,
        AllowedFormats: 1,
        NumberOfQuest: 1,
        DifficultyLevels: 1,
        IsActive: 1,
        IsDefault: 1
      }
    ).sort({ CreatedOn: -1 });

    if (!subscriptions.length) {
      return res.status(404).json({
        status: 'error',
        message: 'No subscription plans found.'
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Active subscription plans retrieved successfully.',
      data: subscriptions
    });

  } catch (error) {
    console.error('❌ Error fetching subscriptions:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error.',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};
