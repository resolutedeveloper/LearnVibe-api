import { Request, Response } from 'express';
import { Subscription } from '../models/subscription.model';
import { decrypt, encrypt } from '../utils/encrypt';
import  Users  from '../models/user.model';
import  UserDecrypt  from '../models/userDecrypt.model';
import { generateToken } from '../utils/jwt';
import UserLogin from '../models/userLogin.model';
import useragent from 'useragent';
import { UserSubscription } from '../models/userSubscription.model';
const now = new Date();

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

    const EncryptedEmail = decrypt(req.body.EmailID);
    const EncryptedPassword = decrypt(req.body.Password);
    console.log(EncryptedEmail + " " + EncryptedPassword);
  
    const existingUser = await UserDecrypt.findOne({ 
      EmailID: EncryptedEmail, 
      Password_Hash: EncryptedPassword 
    });

  
    if (!existingUser) {
      return res.status(404).json({
        status: 'error',
        message: 'Invalid email or password. Please try again.',
      });
    }

    const FinalUser = await Users.findOne({ _id:  existingUser.User_id });
    const token = await generateToken(FinalUser);

    
     // Capture login info
    const agent = useragent.parse(req.headers['user-agent'] || '');
    const OS = agent.os.toString();
    const Browser = agent.toAgent();

    const UserLoginStatus = await UserLogin.create({
      UserID: FinalUser._id,
      DateTime: now,
      OS,
      Browser,
    });

    const UserSubscriptionDetail = await UserSubscription.findOne({ UserID: FinalUser._id, Status: 1 });
    const subscription = await Subscription.findOne({ _id: UserSubscriptionDetail.SubscriptionID });

    if (!subscription) {
      return res.status(500).json({
        status: 'error',
        message: 'Default subscription not found',
      });
      
    }


    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + subscription.Duration);

  
    res.status(200).json({
      ID: FinalUser._id,
      FirstName:FinalUser.FirstName,
      LastName: FinalUser.LastName,
      EmailID: FinalUser.EmailID,
      ContactNumber : FinalUser.ContactNumber, 
      BirthDate : FinalUser.ContactNumber,
      Grade : FinalUser.ContactNumber,
      SubscriptionDetails: {
        "SubscriptionID": subscription._id,
        "StartDate": startDate.toISOString().split('T')[0],
        "EndDate": endDate.toISOString().split('T')[0],
        "ExhaustDate": null,
        "ActualEndDate": null,
        "PaymentAmount": 0,
        "PaymentDuration": subscription.Duration,
        "PaymentCurrency": 'USD',
      },
      UserSubscriptionDetails: {
        "ID": subscription._id,
        "SubscriptionTitle": subscription.SubscriptionTitle,
        "IsFree":subscription.IsFree,
        "Price": subscription.Price,
        "Duration": subscription.Duration,
        "NumOfDocuments": subscription.NumOfDocuments,
        "NoOfPages": subscription.NoOfPages,
        "NumOfQuiz": subscription.NumOfQuiz,
        "AllowedFormats": subscription.AllowedFormats,
        "NumberOfQuest": subscription.NumberOfQuest,
        "DifficultyLevels": subscription.DifficultyLevels,
        "IsActive": subscription.IsActive,
        "IsDefault": subscription.IsDefault
      },
      "DocumentDetails": {
        "ID": "string",
        "UserID": "string",
        "SubscriptionID": "string",
        "DocumentName": "string",
        "DocumentUploadDateTime": "2019-08-24T14:15:22.123Z",
        "Status": 0
      },
      "QuizDetails": {
          "ID": "string",
          "DocumentID": "string",
          "QuizJSON": "string",
          "QuizResponseJSON": "string",
          "Score": 0,
          "Status": 0,
          "Priority": 0
      },
      LoginToken: token,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal Server Error',
    });
  }
};
