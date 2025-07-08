import { Request, Response } from 'express';
import { Subscription } from '../models/subscription.model';
import { decrypt, encrypt } from '../utils/encrypt';
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


export const sign_in = async (req: Request, res: Response) => {
try {

    const EmailID = decrypt(req.body.EmailID);
    const Password = decrypt(req.body.Password);
  

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
