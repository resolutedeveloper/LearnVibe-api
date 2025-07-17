import { Request, Response } from 'express';
import { Subscription } from '../models/subscription.model';
import {
  EncryptBE,
  DecryptBE,
  EncryptFE,
  DecryptFE,
  createPasswordHash,
  checkPasswordHash,
} from '../utils/encrypt';
import dotenv from 'dotenv';
dotenv.config();
import Stripe from 'stripe';
import { error } from 'console';

const stripe = new Stripe(process.env.Secret_key as string, {
  apiVersion: '2024-04-10' as any,
});

export default stripe;
export const subscription = async (req: Request, res: Response): Promise<Response> => {
   try {
    const payload = req.body;
     // Check if a plan with the same title exists
    const existingPlan = await Subscription.findOne({
        SubscriptionTitle: payload.SubscriptionTitle
    });
    if (existingPlan) {
      return res.status(400).json({
        success: 'error',
        message: payload.SubscriptionTitle + ' already exists'
      });
    }
    // return res.json(DecryptBE(req.TokenUser.FirstName));
    const decryptedName =
      req?.TokenUser?.FirstName && DecryptFE(DecryptBE(req.TokenUser.FirstName));

    const createdByName = decryptedName ? decryptedName : 'admin';

    const newSubscription = await Subscription.create({
      ...payload,
      CreatedBy: createdByName,
      LastModifiedBy: createdByName,
      CreatedOn: new Date(),
      LastModifiedOn: new Date()
    });

    const sub = newSubscription.toObject(); // for Mongoose
    const { _id, __v,CreatedBy,LastModifiedOn,LastModifiedBy, ...rest } = sub;

    const formattedSubscription = { 
        ID: _id,
    ...rest
    };

    return res.status(200).json({
        status: 'success',
        message: 'User signed in successfully.',
        data: formattedSubscription
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message || err
    });
  }
};


