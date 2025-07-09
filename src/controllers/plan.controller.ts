import { Request, Response } from 'express';
import { Subscription } from '../models/subscription.model';
import { UserSubscription } from '../models/userSubscription.model';

import QuizModel from '../models/quiz.model';
import UserDocumentModel from '../models/userDocument.model';


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

export const subscribe = async (req: Request, res: Response) => {
   
  return res.json('assassa');
};

export const payment_detail = async (req: Request, res: Response) => {
   
  return res.json('assassa');
};

