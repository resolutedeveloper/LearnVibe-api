import useragent from 'useragent';
import { Request, Response } from 'express';
import { decrypt, encrypt } from '../utils/encrypt';
import { generateToken } from '../utils/jwt';
import User from '../models/user.model';
import UserDecrypt from '../models/userDecrypt.model';
import { Subscription } from '../models/subscription.model';
import { UserSubscription } from '../models/userSubscription.model';
import UserLogin from '../models/userLogin.model';

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // Decrypt incoming fields
    const decryptedFirstName = decrypt(req.body.FirstName);
    const decryptedEmailID = decrypt(req.body.EmailID);
    const decryptedPassword = decrypt(req.body.Password);

    // Re-encrypt for secure storage in main user table
    const doubleEncryptedFirstName = encrypt(req.body.FirstName);
    const doubleEncryptedEmail = encrypt(req.body.EmailID);
    const doubleEncryptedPassword = encrypt(req.body.Password);

    // Check for existing user in UserDecrypt
    const existingUser = await UserDecrypt.findOne({ EmailID: decryptedEmailID });
    if (existingUser) {
      res.status(409).json({
        status: 'error',
        message: 'User already exists',
      });
      return;
    }

    const now = new Date();

    // Create user with encrypted data
    const user = await User.create({
      FirstName: doubleEncryptedFirstName,
      EmailID: doubleEncryptedEmail,
      Password: doubleEncryptedPassword,
      CreatedBy: decryptedFirstName,
      LastModifiedBy: decryptedFirstName,
    });

    // Store decrypted info in UserDecrypt
    await UserDecrypt.create({
      User_id: user._id.toString(),
      EmailID: decryptedEmailID,
      Password_Hash: decryptedPassword,
      CreatedBy: decryptedFirstName,
      LastModifiedBy: decryptedFirstName,
    });

    // Fetch default subscription
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

    // Create user subscription
    const userSubscription = await UserSubscription.create({
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
      CreatedBy: decryptedFirstName,
      LastModifiedOn: now,
      LastModifiedBy: decryptedFirstName,
    });

    // Capture login info
    const agent = useragent.parse(req.headers['user-agent'] || '');
    const OS = agent.os.toString();
    const Browser = agent.toAgent();

    await UserLogin.create({
      UserID: user._id,
      DateTime: now,
      OS,
      Browser,
    });

    // Generate token
    const token = await generateToken(user._id.toString());

    // Send success response
    res.status(200).json({
      ID: user._id,
      FirstName: decryptedFirstName,
      EmailID: decryptedEmailID,
      LoginToken: token,
      CreatedOn: now,
      CreatedBy: decryptedFirstName,
      LastModifiedOn: now,
      LastModifiedBy: decryptedFirstName,
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
