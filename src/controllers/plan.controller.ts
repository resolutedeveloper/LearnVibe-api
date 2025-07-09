import { Request, Response } from 'express';
import { Subscription } from '../models/subscription.model';


export const plan_list = async (req: Request, res: Response) => {
 try {
  const subscriptions = await Subscription.find(
    { IsActive: true },
    {
      SubscriptionTitle: 1,
      IsFree: 1,
      Price: 1,
      Duration: 1,
      NumOfDocuments: 1,
      NoOfPages: 1,
      NumOfQuiz: 1,
      AllowedFormats: 1,
      NumberOfQuest: 1,
      DifficultyLevels: 1,
      IsActive: 1,
      IsDefault: 1,
      CreatedOn: 1
    }
  )
    .sort({ CreatedOn: -1 })
    .lean();

  if (!subscriptions.length) {
    return res.status(404).json({
      status: 'error',
      message: 'Active subscription plans not found.'
    });
  }

  // Format: Add ID and remove _id
  const formattedSubscriptions = subscriptions.map(sub => {
    const { _id, ...rest } = sub;
    return {
      ID: _id,      // Add ID field (first key)
      ...rest       // Spread the rest of the fields without _id
    };
  });

  return res.status(200).json({
    status: 'success',
    message: 'Active subscription plans retrieved successfully.',
    data: formattedSubscriptions
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


