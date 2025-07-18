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


    if (payload.IsDefault === true) {
      await Subscription.updateMany(
        { IsDefault: true }, // Optional filter — or use {} to update all
        { $set: { IsDefault: false,IsFree:false } }
      );
    }
    
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


export const subscription_update = async (req: Request, res: Response): Promise<Response> => {
  try {
    const payload = req.body;
    const subscriptionId = req.params.id;
    // Check if subscription exists
    const existingSubscription = await Subscription.findOne({_id:subscriptionId});
    if (!existingSubscription) {
      return res.status(404).json({
        success: 'error',
        message: 'Subscription not found',
      });
    }

    // Check if another plan with same title exists (excluding current)
    const duplicateTitle = await Subscription.findOne({
      SubscriptionTitle: payload.SubscriptionTitle,
      _id: { $ne: subscriptionId },
    });

    if (duplicateTitle) {
      return res.status(400).json({
        success: 'error',
        message: payload.SubscriptionTitle + ' already exists',
      });
    }

    const decryptedName =
      req?.TokenUser?.FirstName && DecryptFE(DecryptBE(req.TokenUser.FirstName));
    const modifiedByName = decryptedName ? decryptedName : 'admin';

    if (payload.IsDefault === true) {
      await Subscription.updateMany(
        { IsDefault: true }, // Optional filter — or use {} to update all
        { $set: { IsDefault: false,IsFree:false } }
      );
    }

    const updatedSubscription = await Subscription.findByIdAndUpdate(
      subscriptionId,
      {
        ...payload,
        LastModifiedBy: modifiedByName,
        LastModifiedOn: new Date(),
      },
      { new: true }
    );

   

    if (updatedSubscription) {
      const sub = updatedSubscription.toObject();
      const { _id, __v, CreatedBy, LastModifiedOn, LastModifiedBy, ...rest } = sub;
      // Now use `rest` safely

      const formattedSubscription = {
          ID: _id,
          ...rest,
        };

        return res.status(200).json({
          status: 'success',
          message: 'Subscription updated successfully.',
          data: formattedSubscription,
        });
    }

    

    
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message || err,
    });
  }
};

export const getSubscriptionById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const subscriptionId = req.params.id || req.body.id;

    if (!subscriptionId) {
      return res.status(400).json({
        success: 'error',
        message: 'Subscription ID is required.',
      });
    }

    const subscription = await Subscription.findById({_id:subscriptionId});

    if (!subscription) {
      return res.status(404).json({
        success: 'error',
        message: 'Subscription not found.',
      });
    }

    const sub = subscription.toObject();
    const { _id, __v, CreatedBy, LastModifiedBy, LastModifiedOn, ...rest } = sub;

    const formattedSubscription = {
      ID: _id,
      ...rest,
    };

    return res.status(200).json({
      status: 'success',
      message: 'Subscription retrieved successfully.',
      data: formattedSubscription,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Server error.',
      error: err.message || err,
    });
  }
};

export const getAllSubscriptions = async (req: Request, res: Response): Promise<Response> => {
  try {
    const subscriptions = await Subscription.find({ IsDeleted: { $ne: true } }).sort({ CreatedOn: -1 });

    const formattedSubscriptions = subscriptions.map(sub => {
      const { _id, __v, CreatedBy, LastModifiedBy, LastModifiedOn, ...rest } = sub.toObject();
      return {
        ID: _id,
        ...rest,
      };
    });

    return res.status(200).json({
      status: 'success',
      message: 'Subscriptions fetched successfully.',
      data: formattedSubscriptions,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Server error.',
      error: err.message || err,
    });
  }
};

export const permanentDeleteSubscription = async (req: Request, res: Response): Promise<Response> => {
  try {
    const subscriptionId = req.params.id || req.body.id;

    if (!subscriptionId) {
      return res.status(400).json({
        success: 'error',
        message: 'Subscription ID is required.',
      });
    }

    const existing = await Subscription.findOne({_id:subscriptionId});

    if (!existing) {
      return res.status(404).json({
        success: 'error',
        message: 'Subscription not found.',
      });
    }

    await Subscription.findByIdAndDelete(subscriptionId);

    return res.status(200).json({
      status: 'success',
      message: 'Subscription permanently deleted.',
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Server error.',
      error: err.message || err,
    });
  }
};