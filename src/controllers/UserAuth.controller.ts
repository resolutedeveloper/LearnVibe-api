import useragent from 'useragent';
import { Request, Response } from 'express';
import { decrypt, encrypt } from '../utils/encrypt';
import { generateToken } from '../utils/jwt';
import User from '../models/user.model';
import { Subscription } from '../models/subscription.model';
import { UserSubscription } from '../models/userSubscription.model';
import UserLogin from '../models/userLogin.model';

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const FirstName = decrypt(req.body.FirstName);
    const EmailID = decrypt(req.body.EmailID);
    const Password = decrypt(req.body.Password);
    const encryptedEmail = encrypt(EmailID);

    const existingUser = await User.findOne({ EmailID: encryptedEmail });
    if (existingUser) {
      res.status(409).json({
        status: 'error',
        message: 'User already exists',
      });
      return;
    }

    const encryptedPassword = encrypt(Password);
    const now = new Date();

    const user = await User.create({
      FirstName: encrypt(FirstName),
      EmailID: encryptedEmail,
      Password: encryptedPassword,
      CreatedBy: FirstName,
      LastModifiedBy: FirstName,
    });

    const subscription = await Subscription.findOne({ IsDefault: true });
    if (!subscription) {
      res.status(500).json({
        status: 'error',
        message: 'Default subscription not found',
      });
      return;
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + subscription.Duration);

    const userSubscription = new UserSubscription({
      UserID: user._id,
      SubscriptionID: subscription._id,
      StartDate: startDate,
      EndDate: endDate,
      ExhaustDate: null,
      ActualEndDate: null,
      PaymentAmount: 0,
      PaymentDuration: subscription.Duration,
      PaymentCurrency: 'USD',
      Status: 1,
      TransactionID: 'null',
      PaymentGatewayData: 'null',
      CreatedOn: now,
      CreatedBy: FirstName,
      LastModifiedOn: now,
      LastModifiedBy: now,
    });
    await userSubscription.save();

    const agent = useragent.parse(req.headers['user-agent'] || '');
    const OS = agent.os.toString();
    const Browser = agent.toAgent();

    await UserLogin.create({
      UserID: user._id,
      DateTime: now,
      OS,
      Browser,
    });

    const token = await generateToken(user._id as string);

    res.status(200).json({
      ID: user._id,
      FirstName,
      EmailID,
      LoginToken: token,
      SubscriptionDetails: {
        SubscriptionID: subscription._id,
        StartDate: startDate.toISOString().split('T')[0],
        EndDate: endDate.toISOString().split('T')[0],
        ExhaustDate: null,
        ActualEndDate: null,
        PaymentAmount: 0,
        PaymentDuration: subscription.Duration,
        PaymentCurrency: 'USD',
      },
      UserSubscriptionDetails: {
        id: userSubscription._id,
        SubscriptionID: userSubscription.SubscriptionID,
        StartDate: startDate.toISOString().split('T')[0],
        EndDate: endDate.toISOString().split('T')[0],
        ExhaustDate: null,
        ActualEndDate: null,
        PaymentAmount: userSubscription.PaymentAmount,
        PaymentDuration: userSubscription.PaymentDuration,
        PaymentCurrency: userSubscription.PaymentCurrency,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal Server Error',
    });
  }
};
