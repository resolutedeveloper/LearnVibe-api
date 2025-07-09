import { Request, Response } from 'express';
import { Subscription } from '../models/subscription.model';
import { UserSubscription } from '../models/userSubscription.model';
import UserStripe from '../models/userStripe.model';



import QuizModel from '../models/quiz.model';
import UserDocumentModel from '../models/userDocument.model';
import UserModel from '../models/user.model';
import { decrypt, encrypt } from '../utils/encrypt';

import dotenv from 'dotenv';
dotenv.config();
import Stripe from 'stripe';

const stripe = new Stripe(process.env.Secret_key as string, {
  apiVersion: '2024-04-10',  // Use the latest stable version
});

export default stripe;


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


export const get_active_documents = async (req: Request, res: Response) => {
      try {
        const TokenUser = req.TokenUser._id;

        const UserSub = await UserSubscription.findOne({ UserID: TokenUser, Status: 1 });
        if (!UserSub) {
          return res.status(200).json({
            status: 'success',
            message: "Active subscription plans retrieved successfully.",
            data: [
              {
                SubscriptionID: "",
                DocumentDetails: [],
                QuizDetails: []
              }
            ]
          });
        }

        const UserDoc = await UserDocumentModel.find({ UserID: TokenUser, SubscriptionID: UserSub.SubscriptionID });

        const formattedDocs = UserDoc.map(doc => ({
          ID: doc._id,  // Rename _id to ID
          UserID: doc.UserID,
          UsersSubscriptionID: doc.UsersSubscriptionID,
          SubscriptionID: doc.SubscriptionID,
          DocumentName: doc.DocumentName,
          DocumentUploadDateTime: doc.DocumentUploadDateTime,
          Status: doc.Status
        }));

        const documentIds = UserDoc.map(doc => doc._id);

        const allUserQuizzes = await QuizModel.find({ DocumentID: { $in: documentIds } }).lean();

        const modifiedQuizzes = allUserQuizzes.map(({ _id, ...rest }) => ({
          ID: _id,          // 👈 ID comes first
          ...rest
        }));

        return res.status(200).json({
          status: 'success',
          message: 'Active document detail retrieved successfully.',
          data: [
            {
              SubscriptionID: UserSub._id,
              DocumentDetails: formattedDocs,
              QuizDetails: modifiedQuizzes
            }
          ]
        });

      } catch (error) {
        console.error('Error fetching active document details:', error);
        return res.status(500).json({
          status: 'error',
          message: 'An unexpected error occurred. Please try again later.'
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

export const document_upload = async (req: Request, res: Response) => {
   
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

    const TokenUser = req.TokenUser._id;
    const UserSub = await UserSubscription.findOne({UserID:TokenUser, Status : 1});
    // ✅ Step 2: Save to database
    const newDocument = new UserDocumentModel({
      UsersSubscriptionID:UserSub._id,
      UserID:TokenUser,
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
      DocumentID: savedDoc._id.toString(),
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
        DocumentDetails: 
          {
            ID: savedDoc._id,
            UsersSubscriptionID: savedDoc.UsersSubscriptionID,
            UserID: savedDoc.UserID,
            SubscriptionID: savedDoc.SubscriptionID,
            DocumentName: savedDoc.DocumentName,
            DocumentUploadDateTime: savedDoc.DocumentUploadDateTime,
            Status: savedDoc.Status
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
            }
          ]
        
      }
    ],
  });

  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong.',
      error: (error as Error).message,
    });
  }
};

export const payment_detail = async (req: Request, res: Response) => {

     const { SubscriptionID, PaymentAmount, PaymentCurrency, PaymentDuration} = req.body;
			  let amount = PaymentAmount;
        const TokenUser = req.TokenUser._id;
        const UserDetail = await UserModel.findOne({ _id: TokenUser});
        //decrypt, encrypt
        const DecryptEmail = decrypt(UserDetail.EmailID);
        const FinalDecryptEmail =  decrypt(DecryptEmail);

			// Collect Email And Password
			let errors = [];
			if (!FinalDecryptEmail.trim()) {
				errors.push("Email is required.");
			}

			// Return errors if any
			if (errors.length > 0) {
				return res.status(401).json({
					status: "error",
					message: errors.join(" "), // Combine messages into one string
				});
			}

      const CheckEmailDecrypt = await UserStripe.findOne({ EmailID: FinalDecryptEmail });

			let CustRetrieve;
			let session;
      
			if (CheckEmailDecrypt) {
				// -------- if email id already exist then use this -------------
				CustRetrieve = await stripe.customers.retrieve(
					CheckEmailDecrypt.StripeCustomerID
				);

				if (amount != 0) {
					// Not 0 payment
					session = await stripe.checkout.sessions.create({
						payment_method_types: ["card"],
						line_items: [
							{
								price_data: {
									currency: PaymentCurrency,
									product_data: {
										name: '1 Month',
									},
									unit_amount: Math.round(amount * 100),
									recurring: {
										interval: "month",
									},
								},
								quantity: 1,
							},
						],
						//mode: "payment",
						mode: "subscription",
						customer: CustRetrieve.id,
						//customer_email: decryptEmail,
						//   success_url: process.env.PaymentRedirect + '/success',
						success_url:
							process.env.PaymentRedirect + "/success/{CHECKOUT_SESSION_ID}",
						cancel_url:
							process.env.PaymentRedirect + "/cancel/{CHECKOUT_SESSION_ID}",
					});
				} else {
					// 0 payment
					
					session = await stripe.checkout.sessions.create({
						mode: "subscription",
						payment_method_types: ["card"],
						customer: CustRetrieve.id,
						line_items: [
							{
								price_data: {
									currency: "usd",
									product_data: {
										name: "Month",
									},
									unit_amount: Math.round(amount * 100),
									recurring: {
										interval: "month",
									},
								},
								quantity: 1,
							},
						],
						subscription_data: {
							trial_period_days: 30, // ✅ allowed
						},
						success_url:
							process.env.PaymentRedirect + "/success/{CHECKOUT_SESSION_ID}",
						cancel_url:
							process.env.PaymentRedirect + "/cancel/{CHECKOUT_SESSION_ID}",
					});
				}
				// return res.json(session);
			} else {
				// --------- if email id not exist then use this -----------
				const CustRet = await stripe.customers.create({
					name: req.TokenUser.LastName,
					email: FinalDecryptEmail,
					description: `Learn Vibe!`,
				});

				// Create Stripe Customer In Our server
				await UserStripe.create({
					EmailID: FinalDecryptEmail,
					UserID: req.TokenUser._id,
					StripeCustomerID: CustRet.id,
				});
				CustRetrieve = CustRet;

				// Not 0 payment
				if (amount != 0) {
					session = await stripe.checkout.sessions.create({
						payment_method_types: ["card"],
						line_items: [
							{
								price_data: {
									currency: PaymentCurrency,
									product_data: {
										name: 'Learn Vibe',
									},
									unit_amount: Math.round(amount * 100),
									recurring: {
										interval: "month",
									},
								},
								quantity: 1,
							},
						],
						//mode: "payment",
						mode: "subscription",
						customer: CustRetrieve.id,
						//customer_email: decryptEmail,
						//   success_url: process.env.PaymentRedirect + '/success',
						success_url:
							process.env.PaymentRedirect + "/success/{CHECKOUT_SESSION_ID}",
						cancel_url:
							process.env.PaymentRedirect + "/cancel/{CHECKOUT_SESSION_ID}",
					});
				} else {
					// 0 payment
				
					session = await stripe.checkout.sessions.create({
						mode: "subscription",
						payment_method_types: ["card"],
						customer: CustRetrieve.id,
						line_items: [
							{
								price_data: {
									currency: "usd",
									product_data: {
										name: 'Learn Vibe',
									},
									unit_amount: Math.round(amount * 100),
									recurring: {
										interval: "month",
									},
								},
								quantity: 1,
							},
						],
						subscription_data: {
							trial_period_days: 30, // ✅ allowed
						},
						success_url:
							process.env.PaymentRedirect + "/success/{CHECKOUT_SESSION_ID}",
						cancel_url:
							process.env.PaymentRedirect + "/cancel/{CHECKOUT_SESSION_ID}",
					});
				}
			}

			// ✅ Finally return the session URL
			return res.status(200).json({
				status: "success",
				url: session.url,
			});
};

export const subscribe = async (req: Request, res: Response) => {
  
};


