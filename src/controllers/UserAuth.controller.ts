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
    // 1. Decrypt incoming fields
    const FirstName = decrypt(req.body.FirstName);
    const EmailID = decrypt(req.body.EmailID);
    const Password = decrypt(req.body.Password);
    const encryptedEmail = encrypt(EmailID);

    // 2. Check if user already exists
    const existingUser = await User.findOne({ EmailID: encryptedEmail });
    if (existingUser) {
      res.status(409).json({ message: 'User already exists' });
      return;
    }

    // 3. Encrypt password
    const encryptedPassword = encrypt(Password);
    const now = new Date();

    // 4. Create and save the new User
    const user = new User({
      FirstName: encrypt(FirstName),
      EmailID: encryptedEmail,
      Password: encryptedPassword,
      LastName: null,
      ContactNumber: null,
      BirthDate: null,
      Grade: null,
      CreatedOn: now,
      LastModifiedOn: now,
      CreatedBy: FirstName,
      LastModifiedBy: FirstName,
    });
    await user.save();

    // 6. Get Default Subscription
    const subscription = await Subscription.findOne({ IsDefault: true });
    if (!subscription) {
      res.status(500).json({ message: 'Default subscription not found' });
      return;
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + subscription.Duration);

    // 7. Insert into UserSubscription
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
      TransactionID: 'TransactionID',
      PaymentGatewayData: 'PaymentGatewayData',
      CreatedOn: now,
      CreatedBy: FirstName,
      LastModifiedOn: now,
      LastModifiedBy: now,
    });
    await userSubscription.save();

    // 11. Insert login log
    const agent = useragent.parse(req.headers['user-agent'] || '');
    const OS = agent.os.toString();
    const Browser = agent.toAgent();

    await UserLogin.create({
      UserID: user._id,
      DateTime: now,
      OS,
      Browser,
    });

    // 12. Generate token
    const token = await generateToken(user._id as string);

    // 13. Respond
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
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
