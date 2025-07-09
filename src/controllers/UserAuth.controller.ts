import useragent from 'useragent';
import { Request, Response } from 'express';
import { decrypt, decryptFE, encrypt } from '../utils/encrypt';
import { generateToken } from '../utils/jwt';
import User from '../models/user.model';
import UserDecrypt from '../models/userDecrypt.model';
import { Subscription } from '../models/subscription.model';
import { UserSubscription } from '../models/userSubscription.model';
import QuizModel from '../models/quiz.model';
import Users from '../models/user.model';
import Otp from '../models/otp.model';
import UserLog from '../models/userLogin.model';
import UserDocumentModel from '../models/userDocument.model';
import { generateOtp } from '../utils/otp.util';
import { sendOTPEmail } from '../utils/email.util';

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // Step 1: Decrypt incoming data
    const decryptedFirstName = decryptFE(req.body.FirstName);
    const decryptedEmailID = decryptFE(req.body.EmailID);
    const decryptedPassword = decryptFE(req.body.Password);

    // Step 2: Encrypt for storage
    const doubleEncryptedFirstName = encrypt(req.body.FirstName);
    const doubleEncryptedEmail = encrypt(req.body.EmailID);
    const doubleEncryptedPassword = encrypt(req.body.Password);

    // Step 3: Check for existing user
    const existingUser = await UserDecrypt.findOne({ EmailID: decryptedEmailID });
    if (existingUser) {
      res.status(400).json({ status: 'error', message: 'User already exists' });
      return;
    }

    // Step 4: Get default subscription
    const subscription = await Subscription.findOne({ IsDefault: true });
    if (!subscription) {
      res.status(404).json({ status: 'error', message: 'Default subscription not found' });
      return;
    }

    const now = new Date();

    // Step 5: Create user in main table
    const user = await User.create({
      FirstName: doubleEncryptedFirstName,
      EmailID: doubleEncryptedEmail,
      Password: doubleEncryptedPassword,
      CreatedBy: decryptedFirstName,
      LastModifiedBy: decryptedFirstName,
    });

    // Step 6: Store decrypted info
    await UserDecrypt.create({
      User_id: user._id.toString(),
      EmailID: decryptedEmailID,
      Password_Hash: decryptedPassword,
      CreatedBy: decryptedFirstName,
      LastModifiedBy: decryptedFirstName,
    });

    // Step 7: Calculate dates
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + subscription.Duration);

    // Step 8: Create user subscription
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

    // Step 9: Fetch associated document (if any)
    const document = await UserDocumentModel.findOne({ SubscriptionID: subscription._id });

    // Step 10: Fetch associated quiz (if document exists)
    let quiz = null;
    if (document) {
      quiz = await QuizModel.findOne({ DocumentID: document._id });
    }

    // Step 11: Record login info
    const agent = useragent.parse(req.headers['user-agent'] || '');
    const OS = agent.os.toString();
    const Browser = agent.toAgent();

    await UserLog.create({
      UserID: user._id,
      DateTime: now,
      OS,
      Browser,
    });

    // Step 12: Generate JWT token
    const token = await generateToken(user._id.toString());

    // Step 13: Send response
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
      DocumentDetails: document
        ? {
            ID: document._id,
            UserID: document.UserID,
            SubscriptionID: document.SubscriptionID,
            DocumentName: document.DocumentName,
            DocumentUploadDateTime: document.DocumentUploadDateTime,
            Status: document.Status,
          }
        : null,
      QuizDetails: quiz
        ? {
            ID: quiz._id,
            DocumentID: quiz.DocumentID,
            QuizJSON: quiz.QuizJSON,
            QuizResponseJSON: quiz.QuizResponseJSON,
            Score: quiz.Score,
            Status: quiz.Status,
            Priority: quiz.Priority,
          }
        : null,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal Server Error',
    });
  }
};

export const sendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { EMailID, Status } = req.body;

    if (!EMailID || typeof Status !== 'number') {
      res.status(400).json({ message: 'Missing required fields.' });
      return;
    }

    const decryptedEmail = decryptFE(EMailID);
    const doubleEncryptedEmail = encrypt(EMailID);

    if (Status === 0) {
      const existingUser = await UserDecrypt.findOne({ EmailID: decryptedEmail });

      if (existingUser) {
        res.status(400).json({ message: 'Email-ID already exists' });
        return;
      }
    } else if (Status === 1) {
      const user = await UserDecrypt.findOne({ EmailID: decryptedEmail });
      if (!user) {
        res.status(404).json({ message: 'E-Mail ID is not valid' });
        return;
      }
    } else {
      res.status(400).json({ message: 'Invalid status' });
      return;
    }

    const otp = await generateOtp();

    const now = new Date();
    const expiration = new Date(now.getTime() + 5 * 60 * 1000);

    await Otp.create({
      EmailID: decryptedEmail,
      OTP: encrypt(otp),
      Status: 0,
      Timestamp: now,
      ExpirationTimestamp: expiration,
      VerificationTimestamp: null,
      InactiveTimestamp: null,
    });

    await sendOTPEmail({ to: decryptedEmail, otp });

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal Server Error',
    });
  }
};

export const sign_in = async (req: Request, res: Response) => {
  try {
    const EncryptedEmail = decrypt(req.body.EmailID);
    const EncryptedPassword = decrypt(req.body.Password);
    const EmailExistCheck = await UserDecrypt.findOne({
      EmailID: EncryptedEmail,
    });
    const now = new Date();
    if (!EmailExistCheck) {
      return res.status(404).json({
        status: 'error',
        message: 'EmailID does not exist.',
      });
    }

    const existingUser = await UserDecrypt.findOne({
      EmailID: EncryptedEmail,
      Password_Hash: EncryptedPassword,
    });

    if (!existingUser) {
      return res.status(404).json({
        status: 'error',
        message: 'Invalid password. Please try again.',
      });
    }

    const FinalUser = await Users.findOne({ _id: existingUser.User_id });
    if (!FinalUser) {
      return res.status(404).json({
        status: 'error',
        message: 'User not fount.',
      });
    }

    const UserDoc = await UserDocumentModel.find({ UserID: FinalUser._id });
    const formattedDocs = UserDoc.map((doc) => ({
      ID: doc._id, // Rename _id to ID
      UserID: doc.UserID,
      UsersSubscriptionID: doc.UsersSubscriptionID,
      SubscriptionID: doc.SubscriptionID,
      DocumentName: doc.DocumentName,
      DocumentUploadDateTime: doc.DocumentUploadDateTime,
      Status: doc.Status,
    }));

  
    const documentIds = UserDoc.map(doc => doc._id);
          const allUserQuizzes = await QuizModel.find({ DocumentID: { $in: documentIds } }).lean();
          const formattedQuizzes = allUserQuizzes.map(({ _id, ...rest }) => ({
            ID: _id,          // 👈 ID comes first
            ...rest
          }));


    const token = await generateToken(FinalUser);

    // Capture login info
    const agent = useragent.parse(req.headers['user-agent'] || '');
    const OS = agent.os.toString();
    const Browser = agent.toAgent();

    const UserLoginStatus = await UserLog.create({
      UserID: FinalUser._id,
      DateTime: now,
      OS,
      Browser,
    });

    const UserSubscriptionDetail = await UserSubscription.findOne({
      UserID: FinalUser._id,
      Status: 1,
    });
    if (!UserSubscriptionDetail) {
      return res.status(404).json({
        status: 'error',
        message: 'No active subscription plan found for the user.',
      });
    }

    const subscription = await Subscription.findOne({ _id: UserSubscriptionDetail.SubscriptionID });
    if (!subscription) {
      return res.status(500).json({
        status: 'error',
        message: 'Subscription plan does not found.',
      });
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + subscription.Duration);

    res.status(200).json({
       status: 'success',
          message: 'User signed in successfully.',
          data: [{
        ID: FinalUser._id,
        FirstName: decrypt(FinalUser.FirstName),
        LastName: FinalUser.LastName,
        EmailID: decrypt(FinalUser.EmailID),
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
        "DocumentDetails": formattedDocs,
        "QuizDetails": formattedQuizzes,
        LoginToken: token
    }]
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal Server Error',
    });
  }
};
