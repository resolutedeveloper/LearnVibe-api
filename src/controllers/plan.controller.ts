import { Request, Response } from 'express';
import { Subscription } from '../models/subscription.model';
import { UserSubscription } from '../models/userSubscription.model';
import UserStripe from '../models/userStripe.model';
import QuizModel from '../models/quiz.model';
import UserDocumentModel from '../models/userDocument.model';
import UserModel from '../models/user.model';
import { IQuiz } from '../models/quiz.model';
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

const stripe = new Stripe(process.env.Secret_key as string, {
  apiVersion: '2024-04-10' as any,
});

export default stripe;
export const plan_list = async (req: Request, res: Response): Promise<Response> => {
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
        CreatedOn: 1,
      }
    )
      .sort({ CreatedOn: -1 })
      .lean();

    if (!subscriptions.length) {
      return res.status(404).json({
        status: 'error',
        message: 'Active subscription plans not found.',
      });
    }

    // Format: Add ID and remove _id
    const formattedSubscriptions = subscriptions.map((sub) => {
      const { _id, ...rest } = sub;
      return {
        ID: _id, // Add ID field (first key)
        ...rest, // Spread the rest of the fields without _id
      };
    });

    return res.status(200).json({
      status: 'success',
      message: 'Active subscription plans retrieved successfully.',
      data: formattedSubscriptions,
    });
  } catch (error) {
    console.error('❌ Error fetching subscriptions:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error.',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const get_active_documents = async (req: Request, res: Response): Promise<Response> => {
  try {
    const TokenUser = req.TokenUser!._id;

    const UserSub = await UserSubscription.findOne({ UserID: TokenUser, Status: 1 });
    if (!UserSub) {
      return res.status(200).json({
        status: 'success',
        message: 'Active subscription plans retrieved successfully.',
        data: [
          {
            SubscriptionID: '',
            DocumentDetails: [],
            QuizDetails: [],
          },
        ],
      });
    }

    const UserDoc = await UserDocumentModel.find({
      UserID: TokenUser,
      SubscriptionID: UserSub.SubscriptionID,
    });

    const formattedDocs = UserDoc.map((doc) => ({
      ID: doc._id, // Rename _id to ID
      UserID: doc.UserID,
      UsersSubscriptionID: doc.UsersSubscriptionID,
      SubscriptionID: doc.SubscriptionID,
      DocumentName: doc.DocumentName,
      DocumentUploadDateTime: doc.DocumentUploadDateTime,
      Status: doc.Status,
    }));

    const documentIds = UserDoc.map((doc) => doc._id);

    const allUserQuizzes = await QuizModel.find({ DocumentID: { $in: documentIds } }).lean();

    const modifiedQuizzes = allUserQuizzes.map(({ _id, ...rest }) => ({
      ID: _id, // 👈 ID comes first
      ...rest,
    }));

    return res.status(200).json({
      status: 'success',
      message: 'Active document detail retrieved successfully.',
      data: [
        {
          SubscriptionID: UserSub._id,
          DocumentDetails: formattedDocs,
          QuizDetails: modifiedQuizzes,
        },
      ],
    });
  } catch (error) {
    console.error('Error fetching active document details:', error);
    return res.status(500).json({
      status: 'error',
      message: 'An unexpected error occurred. Please try again later.',
    });
  }

  //This Is new Json
  // Step 1: Create a Map of DocumentID to DocumentDetails
  // const documentMap = new Map();
  // formattedDocs.forEach(doc => {
  //   documentMap.set(doc.ID.toString(), doc);
  // });

  // // Step 2: Group Quizzes by DocumentID
  // const quizMap = new Map();
  // modifiedQuizzes.forEach(quiz => {
  //   const docId = quiz.DocumentID.toString();
  //   if (!quizMap.has(docId)) {
  //     quizMap.set(docId, []);
  //   }
  //   quizMap.get(docId).push(quiz);
  // });

  // // Step 3: Build the DocumentDetailsQuizDetails Array
  // const DocumentQuizDetails = Array.from(documentMap.entries()).map(([docId, docDetails]) => ({
  //   DocumentDetails: docDetails,
  //   QuizDetails: quizMap.get(docId) || []
  // }));

  // // Step 4: Final Response
  // return res.status(200).json({
  //   status: 'success',
  //   message: 'Active document detail retrieved successfully.',
  //   data: [
  //     {
  //       SubscriptionID: UserSub._id,
  //       DocumentQuizDetails
  //     }
  //   ]
  // });
};

export const document_upload = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { SubscriptionID, DocumentName } = req.body;

    // ✅ Step 1: Validate required fields
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No file uploaded.' });
    }

    if (!SubscriptionID || !DocumentName) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields.',
      });
    }

    const TokenUser = req.TokenUser!._id;
    const UserSub = await UserSubscription.findOne({ UserID: TokenUser, Status: 1 });

    if (!UserSub) {
      return res.status(400).json({ error: 'User subscription not found' });
    }

    // ✅ Step 2: Save to database
    const newDocument = new UserDocumentModel({
      UsersSubscriptionID: UserSub._id,
      UserID: TokenUser,
      SubscriptionID,
      DocumentName,
      DocumentUploadDateTime: new Date(),
      Status: 0,
    });

    const savedDoc = await newDocument.save();

    if (!savedDoc) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to save document in database.',
      });
    }

    const staticQuizData = {
      questions: [
        {
          question: 'What is the capital of France?',
          options: ['Paris', 'London', 'Berlin', 'Rome'],
          correctAnswer: 'Paris',
        },
        {
          question: 'What is 2 + 2?',
          options: ['3', '4', '5', '6'],
          correctAnswer: '4',
        },
      ],
    };

    const staticQuizResponse = {
      responses: [
        {
          question: 'What is the capital of France?',
          selectedAnswer: 'Paris',
          isCorrect: true,
        },
        {
          question: 'What is 2 + 2?',
          selectedAnswer: '4',
          isCorrect: true,
        },
      ],
    };

    const staticQuizHistory = [
      {
        timestamp: new Date().toISOString(),
        question: 'What is the capital of France?',
        selectedAnswer: 'Paris',
        isCorrect: true,
      },
      {
        timestamp: new Date().toISOString(),
        question: 'What is 2 + 2?',
        selectedAnswer: '4',
        isCorrect: true,
      },
    ];

    const newQuiz = new QuizModel({
      DocumentID: (savedDoc as any)._id.toString(),
      QuizJSON: staticQuizData,
      QuizResponseJSON: staticQuizResponse,
      Score: 100,
      Status: 1,
      Priority: 1,
      QuizAnswerHistory: staticQuizHistory,
    });

    const savedQuiz = await newQuiz.save();

    if (!savedQuiz) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to create quiz.',
      });
    }

    // ✅ Step 3: Success response
    return res.status(200).json({
      status: 'success',
      message: 'File uploaded and document saved successfully.',
      data: [
        {
          DocumentDetails: {
            ID: savedDoc._id,
            UsersSubscriptionID: savedDoc.UsersSubscriptionID,
            UserID: savedDoc.UserID,
            SubscriptionID: savedDoc.SubscriptionID,
            DocumentName: savedDoc.DocumentName,
            DocumentUploadDateTime: savedDoc.DocumentUploadDateTime,
            Status: savedDoc.Status,
          },

          QuizDetails: [
            {
              ID: savedQuiz._id,
              DocumentID: savedQuiz.DocumentID,
              QuizJSON: savedQuiz.QuizJSON,
              QuizResponseJSON: savedQuiz.QuizResponseJSON,
              Score: savedQuiz.Score,
              Status: savedQuiz.Status,
              Priority: savedQuiz.Priority,
              QuizAnswerHistory: savedQuiz.QuizAnswerHistory,
            },
          ],
        },
      ],
    });
  } catch (error) {
    console.error('Upload Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong.',
      error: (error as Error).message,
    });
  }
};

export const payment_detail = async (req: Request, res: Response): Promise<Response> => {
  const { SubscriptionID, PaymentAmount, PaymentCurrency, PaymentDuration } = req.body;
  // Get Subscription Plan
  const subscriptions = await Subscription.findOne(
    { IsActive: true, _id: SubscriptionID },
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
      CreatedOn: 1,
    }
  )
    .sort({ CreatedOn: -1 })
    .lean();

  if (!subscriptions) {
    return res.status(404).json({
      status: 'error',
      message: 'Active subscription plans not found.',
    });
  }

  //return res.json(subscriptions);
  let amount = PaymentAmount;
  const TokenUser = req.TokenUser!._id;
  const UserDetail = await UserModel.findOne({ _id: TokenUser });
  //decrypt, encrypt
  if (!UserDetail?.EmailID) {
    return res.status(400).json({ error: 'User email not found' });
  }

  const DecryptEmail = DecryptBE(UserDetail.EmailID);
  const FinalDecryptEmail = DecryptFE(DecryptEmail);

  // Collect Email And Password
  let errors = [];
  if (!FinalDecryptEmail.trim()) {
    errors.push('Email is required.');
  }

  // Return errors if any
  if (errors.length > 0) {
    return res.status(401).json({
      status: 'error',
      message: errors.join(' '), // Combine messages into one string
    });
  }

  const CheckEmailDecrypt = await UserStripe.findOne({ EmailID: FinalDecryptEmail });

  let CustRetrieve;
  let session;

  if (CheckEmailDecrypt) {
    // -------- if email id already exist then use this -------------
    CustRetrieve = await stripe.customers.retrieve(CheckEmailDecrypt.StripeCustomerID);

    if (amount != 0) {
      // Not 0 payment
      session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: PaymentCurrency,
              product_data: {
                name: subscriptions.SubscriptionTitle,
              },
              unit_amount: Math.round(amount * 100),
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
        //mode: "payment",
        mode: 'subscription',
        customer: CustRetrieve.id,
        //customer_email: decryptEmail,
        //   success_url: process.env.PaymentRedirect + '/success',
        success_url: process.env.PaymentRedirect + '/success/{CHECKOUT_SESSION_ID}',
        cancel_url: process.env.PaymentRedirect + '/cancel/{CHECKOUT_SESSION_ID}',
      });
    } else {
      // 0 payment
      session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        customer: CustRetrieve.id,
        line_items: [
          {
            price_data: {
              currency: PaymentCurrency,
              product_data: {
                name: subscriptions.SubscriptionTitle,
              },
              unit_amount: Math.round(amount * 100),
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
        subscription_data: {
          trial_period_days: 30, // ✅ allowed
        },
        success_url: process.env.PaymentRedirect + '/success/{CHECKOUT_SESSION_ID}',
        cancel_url: process.env.PaymentRedirect + '/cancel/{CHECKOUT_SESSION_ID}',
      });
    }
    // return res.json(session);
  } else {
    // --------- if email id not exist then use this -----------
    const CustRet = await stripe.customers.create({
      name: req.TokenUser!.LastName,
      email: FinalDecryptEmail,
      description: subscriptions.DifficultyLevels,
    });

    // Create Stripe Customer In Our server
    await UserStripe.create({
      EmailID: FinalDecryptEmail,
      UserID: req.TokenUser!._id,
      StripeCustomerID: CustRet.id,
    });
    CustRetrieve = CustRet;

    // Not 0 payment
    if (amount != 0) {
      session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: PaymentCurrency,
              product_data: {
                name: subscriptions.SubscriptionTitle,
              },
              unit_amount: Math.round(amount * 100),
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
        //mode: "payment",
        mode: 'subscription',
        customer: CustRetrieve.id,
        //customer_email: decryptEmail,
        //   success_url: process.env.PaymentRedirect + '/success',
        success_url: process.env.PaymentRedirect + '/success/{CHECKOUT_SESSION_ID}',
        cancel_url: process.env.PaymentRedirect + '/cancel/{CHECKOUT_SESSION_ID}',
      });
    } else {
      // 0 payment

      session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        customer: CustRetrieve.id,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: subscriptions.SubscriptionTitle,
              },
              unit_amount: Math.round(amount * 100),
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
        subscription_data: {
          trial_period_days: 30, // ✅ allowed
        },
        success_url: process.env.PaymentRedirect + '/success/{CHECKOUT_SESSION_ID}',
        cancel_url: process.env.PaymentRedirect + '/cancel/{CHECKOUT_SESSION_ID}',
      });
    }
  }
  // ✅ Finally return the session URL
  return res.status(200).json({
    status: 'success',
    url: session.url,
  });
};

export const subscribe = async (req: Request, res: Response): Promise<Response> => {
  try {
    const {
      SubscriptionID,
      PaymentAmount,
      PaymentCurrency,
      PaymentDuration,
      StartDate,
      EndDate,
      TransactionID,
      PaymentGatewayData,
    } = req.body;

    const subscriptions = await Subscription.findOne(
      { IsActive: true, _id: SubscriptionID },
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
        CreatedOn: 1,
      }
    )
      .sort({ CreatedOn: -1 })
      .lean();

    if (!subscriptions) {
      return res.status(404).json({
        status: 'error',
        message: 'Active subscription plans not found.',
      });
    }

    const { _id, ...rest } = subscriptions;
    const formattedSubscriptions = {
      ID: _id,
      ...rest,
    };

    const TokenUser = req.TokenUser!._id;
    const FirstName = DecryptBE(req.TokenUser!.FirstName);
    const FinalFirstName = DecryptFE(FirstName);
    const currentDateTime = new Date(); // ✅ Current Date-Time

    await UserSubscription.updateMany(
      {
        UserID: TokenUser,
        Status: 1,
      },
      {
        $set: {
          Status: 0,
          LastModifiedOn: currentDateTime,
          LastModifiedBy: FinalFirstName,
        },
      }
    );

    const newSubscription = new UserSubscription({
      UserID: TokenUser,
      SubscriptionID: SubscriptionID,
      StartDate: StartDate,
      EndDate: EndDate,
      ExhaustDate: '',
      ActualEndDate: '',
      PaymentAmount: PaymentAmount,
      PaymentCurrency: PaymentCurrency,
      CreatedOn: currentDateTime, // ✅ Added here
      CreatedBy: FinalFirstName,
      LastModifiedOn: currentDateTime, // ✅ Added here
      LastModifiedBy: FinalFirstName,
      PaymentDuration: PaymentDuration,
      Status: 1,
      TransactionID: TransactionID,
      PaymentGatewayData: PaymentGatewayData,
    });

    const savedSubscription = await newSubscription.save();

    return res.status(200).json({
      status: 'success',
      message: 'Subscription record created successfully.',
      data: [
        {
          UsersSubscriptionDetails: savedSubscription,
          SubscriptionDetails: formattedSubscriptions,
        },
      ],
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

export const quiz_pause_complete = async (req: Request, res: Response): Promise<Response> => {
  // const hashed = await createPasswordHash('123');
  // const isValid = await checkPasswordHash('123', '$2b$10$Z3nC.lUA9KYtgVj3z3bCIeSycYwqA7rKgiq.gTujFFUzhEyLsFWlu');
  // return res.json({ hashedPassword: isValid });
  try {
    const { QuizID, QuizResponseJSON, Status, StartTime, EndTime } = req.body;
    if (!QuizID) {
      return res.status(400).json({ status: 'error', message: 'QuizID is required' });
    }

    if (!QuizID) {
      return res.status(400).json({
        status: 'error',
        message: 'QuizID is required',
      });
    }

    // Prepare update object
    let updateData = {
      QuizResponseJSON: QuizResponseJSON,
      Status: Status,
      QuizAnswerHistory: [{ StartTime: StartTime, EndTime: EndTime }],
    };
    // Conditionally add Score if Status == 1
    if (Status == 1) {
      (updateData as any).Score = 900;
    }

    // Perform the update
    const updatedQuiz = await QuizModel.findOneAndUpdate(
      { _id: QuizID },
      updateData,
      { new: true, upsert: false } // return updated document, don't insert new one
    );

    if (!updatedQuiz) {
      return res.status(404).json({
        status: 'error',
        message: 'Quiz not found',
      });
    }

    let QuzeMessage = 'Quiz updated successfully'; // Default message
    if (Status == 1) {
      QuzeMessage = 'Quiz completed successfully';
    } else if (Status == 2) {
      QuzeMessage = 'Quiz paused successfully';
    } else if (Status == 0) {
      QuzeMessage = 'Quiz pending successfully';
    }

    const formattedData: any = {
      ID: updatedQuiz._id,
      DocumentID: updatedQuiz.DocumentID,
      QuizJSON: updatedQuiz.QuizJSON,
      QuizResponseJSON: updatedQuiz.QuizResponseJSON,
      Score: updatedQuiz.Score,
      Status: updatedQuiz.Status,
      Priority: updatedQuiz.Priority,
      QuizAnswerHistory: updatedQuiz.QuizAnswerHistory,
    };

    return res.status(200).json({
      status: 'success',
      message: QuzeMessage,
      data: formattedData,
    });
  } catch (error) {
    console.error('Error updating quiz:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

export const user_history = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.TokenUser!._id;

    if (!userId) {
      return res.status(400).json({ status: 'error', message: 'User ID is required' });
    }

    // Fetch user subscription details
    const UsersSubscriptionDetails = await UserSubscription.find({ UserID: userId }).lean();

    // Fetch user documents
    const UserDocumentDetails = await UserDocumentModel.find({ UserID: userId }).lean();

    // Extract all document IDs from the documents for quiz lookup
    const documentIds = UserDocumentDetails.map((doc) => doc._id);

    // Fetch all quizzes related to those documents
    const Quiz = await QuizModel.find({ DocumentID: { $in: documentIds } }).lean();

    return res.status(200).json({
      status: 'success',
      message: 'User history fetched successfully',
      data: {
        UsersSubscriptionDetails,
        UserDocumentDetails,
        Quiz,
      },
    });
  } catch (error) {
    console.error('Error fetching user history:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};
