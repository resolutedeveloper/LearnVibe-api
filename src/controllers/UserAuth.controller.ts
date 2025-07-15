import useragent from 'useragent';
import { Request, Response } from 'express';
import {
  createPasswordHash,
  DecryptFE,
  DecryptBE,
  EncryptBE,
  checkPasswordHash,
} from '../utils/encrypt';
import { generateToken } from '../utils/jwt';
import User from '../models/user.model';
import { Subscription } from '../models/subscription.model';
import { UserSubscription } from '../models/userSubscription.model';
import QuizModel from '../models/quiz.model';
import Users from '../models/user.model';
import Otp from '../models/otp.model';
import UserLog from '../models/userLogin.model';
import UserDocumentModel from '../models/userDocument.model';
import { generateOtp } from '../utils/otp.util';
import { sendOTPEmail } from '../utils/email.util';

import Stripe from 'stripe';

const stripe = new Stripe(process.env.Secret_key as string, {
  apiVersion: '2024-04-10' as any,
});

export default stripe;

const createUserAndSubscription = async (
  email: string,
  firstName: string,
  password: string,
  userAgent: string
) => {
  // Step 1: Decrypt incoming data
  const decryptedFirstName = DecryptFE(firstName);
  const decryptedEmailID = DecryptFE(email);

  // Step 2: Encrypt for storage
  const doubleEncryptedFirstName = EncryptBE(firstName);
  const doubleEncryptedEmail = EncryptBE(email);
  const doubleEncryptedPassword = EncryptBE(password);

  const passwordHash = await createPasswordHash(doubleEncryptedPassword);

  // Step 3: Check for existing user
  const existingUser = await User.findOne({ EmailID: doubleEncryptedEmail });
  if (existingUser) {
    return { status: 'error', message: 'User already exists' };
  }

  // Step 4: Get default subscription
  const subscription = await Subscription.findOne({ IsDefault: true });
  if (!subscription) {
    return { status: 'error', message: 'Default subscription not found' };
  }

  const now = new Date();

  // Step 5: Create user in main table
  const user = await User.create({
    FirstName: doubleEncryptedFirstName,
    EmailID: doubleEncryptedEmail,
    Password: passwordHash,
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
  const agent = useragent.parse(userAgent || '');
  const OS = agent.os.toString();
  const Browser = agent.toAgent();

  await UserLog.create({
    UserID: user._id,
    DateTime: now,
    OS,
    Browser,
  });

  // Step 12: Generate JWT token
  const token = await generateToken(user);

  // Step 13: Send response
  return {
    status: 'success',
    message: 'User Created!',
    data: {
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
    },
  };
};

export const registerUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { FirstName, EmailID, Password } = req.body;

    const result = await createUserAndSubscription(
      EmailID,
      FirstName,
      Password,
      req.headers['user-agent'] || ''
    );

    if ((result as any).status === 'error') {
      return res.status(409).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal Server Error',
    });
  }
};

export const sendOtp = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { EMailID, Status } = req.body;
    if (!EMailID || typeof Status !== 'number') {
      return res.status(400).json({ status: 'error', message: 'Missing required fields.' });
    }

    const decryptedEmail = DecryptFE(EMailID);
    const doubleEncryptedEmail = EncryptBE(EMailID);

    if (Status === 0) {
      const existingUser = await Users.findOne({ EmailID: doubleEncryptedEmail });

      if (existingUser) {
        return res.status(400).json({ status: 'error', message: 'Email-ID already exists' });
      }
    } else if (Status === 1) {
      const user = await Users.findOne({ EmailID: doubleEncryptedEmail });
      if (!user) {
        return res.status(404).json({ status: 'error', message: 'E-Mail ID is not valid' });
      }
    } else {
      return res.status(400).json({ status: 'error', message: 'Invalid status' });
    }

    const otp = await generateOtp();

    const now = new Date();
    const expiration = new Date(now.getTime() + 5 * 60 * 1000);

    await Otp.create({
      EmailID: doubleEncryptedEmail,
      OTP: EncryptBE(otp),
      Status: Status,
      Timestamp: now,
      ExpirationTimestamp: expiration,
      VerificationTimestamp: null,
      InactiveTimestamp: null,
    });

    await sendOTPEmail({ to: decryptedEmail, otp });

    return res.status(200).json({ status: 'success', message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Send OTP error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

export const verifyOtp = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { EmailID, OTP: OTP_FE, FirstName, Password, Status } = req.body;

    if (!EmailID || !OTP_FE || typeof Status === 'undefined') {
      return res.status(400).json({ status: 'error', message: 'Missing required fields' });
    }

    const decryptedOtp = DecryptFE(OTP_FE);

    const encryptedEmail = EncryptBE(EmailID);
    const encryptedOtp = EncryptBE(decryptedOtp);

    const otpRecord = await Otp.findOne({
      EmailID: encryptedEmail,
      OTP: encryptedOtp,
      Status: { $in: [0, 1] },
    }).sort({ Timestamp: -1 });

    if (!otpRecord) {
      return res.status(401).json({ status: 'error', message: 'OTP is Invalid' });
    }

    const currentTime = new Date();
    const otpTime = new Date(otpRecord.Timestamp);
    const timeDiffInSeconds = (currentTime.getTime() - otpTime.getTime()) / 1000;

    if (otpRecord.Status === 3 || timeDiffInSeconds >= 600) {
      otpRecord.Status = 3;
      otpRecord.ExpirationTimestamp = currentTime;
      await otpRecord.save();
      return res.status(410).json({ status: 'error', message: 'OTP has expired' });
    }

    otpRecord.Status = 1;
    otpRecord.VerificationTimestamp = currentTime;
    await otpRecord.save();

    if (FirstName && Password && Status === 0) {
      const result = await createUserAndSubscription(
        EmailID,
        FirstName,
        Password,
        req.headers['user-agent'] || ''
      );

      if ((result as any).status === 'error') {
        return res.status(409).json(result);
      }

      return res.status(200).json(result);
    } else if (FirstName && Password && Status === 1) {
      const doubleEncryptedPassword = EncryptBE(Password);

      const passwordHash = await createPasswordHash(doubleEncryptedPassword);

      const updateData: any = {
        Password: passwordHash,
        LastModifiedOn: new Date(),
        LastModifiedBy: DecryptFE(req.body.FirstName),
      };

      const updatedUser = await User.findOneAndUpdate({ EmailID: encryptedEmail }, updateData, {
        new: true,
      });

      if (!updatedUser) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found',
        });
      }

      return res.status(200).json({ status: 'success', message: 'Password Reset success!' });
    } else {
      return res
        .status(200)
        .json({ status: 'success', message: 'OTP has been verified successfully' });
    }
  } catch (error) {
    console.error('OTP verification error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

export const sign_in = async (req: Request, res: Response): Promise<Response> => {
  try {
    const EncryptedEmail = EncryptBE(req.body.EmailID);
    const EncryptedPassword = EncryptBE(req.body.Password);

    const EmailExistCheck = await Users.findOne({
      EmailID: EncryptedEmail,
    });

    const now = new Date();
    if (!EmailExistCheck) {
      return res.status(404).json({
        status: 'error',
        message: 'EmailID does not exist.',
      });
    }
    const isValid = await checkPasswordHash(EncryptedPassword, EmailExistCheck.Password);
    // return res.json(isValid);
    // const existingUser = await UserDecrypt.findOne({
    //   EmailID: EncryptedEmail,
    //   Password_Hash: EncryptedPassword,
    // });
    if (isValid == false) {
      return res.status(404).json({
        status: 'error',
        message: 'Invalid password. Please try again.',
      });
    }

    const FinalUser = await Users.findOne({ EmailID: EncryptedEmail });
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

    const documentIds = UserDoc.map((doc) => doc._id);
    const allUserQuizzes = await QuizModel.find({ DocumentID: { $in: documentIds } }).lean();
    const formattedQuizzes = allUserQuizzes.map(({ _id, ...rest }) => ({
      ID: _id, // 👈 ID comes first
      ...rest,
    }));

    const token = await generateToken(FinalUser);

    // Capture login info
    const agent = useragent.parse(req?.headers['user-agent'] || '');
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

    return res.status(200).json({
      status: 'success',
      message: 'User signed in successfully.',
      data: [
        {
          ID: FinalUser._id,
          FirstName: DecryptBE(FinalUser.FirstName),
          LastName: FinalUser.LastName,
          EmailID: DecryptBE(FinalUser.EmailID),
          ContactNumber: FinalUser.ContactNumber,
          BirthDate: FinalUser.ContactNumber,
          Grade: FinalUser.ContactNumber,
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
            ID: subscription._id,
            SubscriptionTitle: subscription.SubscriptionTitle,
            IsFree: subscription.IsFree,
            Price: subscription.Price,
            Duration: subscription.Duration,
            NumOfDocuments: subscription.NumOfDocuments,
            NoOfPages: subscription.NoOfPages,
            NumOfQuiz: subscription.NumOfQuiz,
            AllowedFormats: subscription.AllowedFormats,
            NumberOfQuest: subscription.NumberOfQuest,
            DifficultyLevels: subscription.DifficultyLevels,
            IsActive: subscription.IsActive,
            IsDefault: subscription.IsDefault,
          },
          DocumentDetails: formattedDocs,
          QuizDetails: formattedQuizzes,
          LoginToken: token,
        },
      ],
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal Server Error',
    });
  }
};

export const webhook_payment = async (req: Request, res: Response): Promise<Response> => {
	try {
    return res.json('jhsujaas');
		// 		const paymentdata = {
		// 		"id": "in_1RgMx4G7f85eY9IUeVbOLk2o",
		// 		"object": "invoice",
		// 		"account_country": "US",
		// 		"account_name": "Talma LLC",
		// 		"account_tax_ids": null,
		// 		"amount_due": 0,
		// 		"amount_overpaid": 0,
		// 		"amount_paid": 0,
		// 		"amount_remaining": 0,
		// 		"amount_shipping": 0,
		// 		"application": null,
		// 		"application_fee_amount": null,
		// 		"attempt_count": 0,
		// 		"attempted": true,
		// 		"auto_advance": false,
		// 		"automatic_tax": {
		// 			"disabled_reason": null,
		// 			"enabled": false,
		// 			"liability": null,
		// 			"provider": null,
		// 			"status": null
		// 		},
		// 		"automatically_finalizes_at": null,
		// 		"billing_reason": "subscription_create",
		// 		"charge": null,
		// 		"collection_method": "charge_automatically",
		// 		"created": 1751448458,
		// 		"currency": "usd",
		// 		"custom_fields": null,
		// 		"customer": "cus_Sba7e7TRvH06jJ",
		// 		"customer_address": null,
		// 		"customer_email": "manthan@yopmail.com",
		// 		"customer_name": "manthan",
		// 		"customer_phone": null,
		// 		"customer_shipping": null,
		// 		"customer_tax_exempt": "none",
		// 		"customer_tax_ids": [],
		// 		"default_payment_method": null,
		// 		"default_source": null,
		// 		"default_tax_rates": [],
		// 		"description": null,
		// 		"discount": null,
		// 		"discounts": [],
		// 		"due_date": null,
		// 		"effective_at": 1751448458,
		// 		"ending_balance": 0,
		// 		"footer": null,
		// 		"from_invoice": null,
		// 		"hosted_invoice_url": "https://invoice.stripe.com/i/acct_1R4zOQG7f85eY9IU/test_YWNjdF8xUjR6T1FHN2Y4NWVZOUlVLF9TYmE3UjBTdXRCa1NSblFjT1JIcTRWa245cWdTRjBZLDE0MTk4OTI2MA0200SC1Kbt9q?s=ap",
		// 		"invoice_pdf": "https://pay.stripe.com/invoice/acct_1R4zOQG7f85eY9IU/test_YWNjdF8xUjR6T1FHN2Y4NWVZOUlVLF9TYmE3UjBTdXRCa1NSblFjT1JIcTRWa245cWdTRjBZLDE0MTk4OTI2MA0200SC1Kbt9q/pdf?s=ap",
		// 		"issuer": {
		// 			"type": "self"
		// 		},
		// 		"last_finalization_error": null,
		// 		"latest_revision": null,
		// 		"lines": {
		// 			"object": "list",
		// 			"data": [
		// 				{
		// 					"id": "il_1RgMx4G7f85eY9IUFi1lrZLg",
		// 					"object": "line_item",
		// 					"amount": 0,
		// 					"amount_excluding_tax": 0,
		// 					"currency": "usd",
		// 					"description": "Trial period for Boobud Monthly Plan",
		// 					"discount_amounts": [],
		// 					"discountable": true,
		// 					"discounts": [],
		// 					"invoice": "in_1RgMx4G7f85eY9IUeVbOLk2o",
		// 					"livemode": false,
		// 					"metadata": {},
		// 					"parent": {
		// 						"invoice_item_details": null,
		// 						"subscription_item_details": {
		// 							"invoice_item": null,
		// 							"proration": false,
		// 							"proration_details": {
		// 								"credited_items": null
		// 							},
		// 							"subscription": "sub_1RgMx4G7f85eY9IUiNOMNiF2",
		// 							"subscription_item": "si_Sba78Ox1L3yUCb"
		// 						},
		// 						"type": "subscription_item_details"
		// 					},
		// 					"period": {
		// 						"end": 1754040458,
		// 						"start": 1751448458
		// 					},
		// 					"plan": {
		// 						"id": "price_1Rc4DYG7f85eY9IUVjZOiNBP",
		// 						"object": "plan",
		// 						"active": true,
		// 						"aggregate_usage": null,
		// 						"amount": 10000,
		// 						"amount_decimal": "10000",
		// 						"billing_scheme": "per_unit",
		// 						"created": 1750423132,
		// 						"currency": "usd",
		// 						"interval": "month",
		// 						"interval_count": 1,
		// 						"livemode": false,
		// 						"metadata": {},
		// 						"meter": null,
		// 						"nickname": null,
		// 						"product": "prod_SX8UbjIiMy1fxR",
		// 						"tiers_mode": null,
		// 						"transform_usage": null,
		// 						"trial_period_days": null,
		// 						"usage_type": "licensed"
		// 					},
		// 					"pretax_credit_amounts": [],
		// 					"price": {
		// 						"id": "price_1Rc4DYG7f85eY9IUVjZOiNBP",
		// 						"object": "price",
		// 						"active": true,
		// 						"billing_scheme": "per_unit",
		// 						"created": 1750423132,
		// 						"currency": "usd",
		// 						"custom_unit_amount": null,
		// 						"livemode": false,
		// 						"lookup_key": null,
		// 						"metadata": {},
		// 						"nickname": null,
		// 						"product": "prod_SX8UbjIiMy1fxR",
		// 						"recurring": {
		// 							"aggregate_usage": null,
		// 							"interval": "month",
		// 							"interval_count": 1,
		// 							"meter": null,
		// 							"trial_period_days": null,
		// 							"usage_type": "licensed"
		// 						},
		// 						"tax_behavior": "unspecified",
		// 						"tiers_mode": null,
		// 						"transform_quantity": null,
		// 						"type": "recurring",
		// 						"unit_amount": 10000,
		// 						"unit_amount_decimal": "10000"
		// 					},
		// 					"pricing": {
		// 						"price_details": {
		// 							"price": "price_1Rc4DYG7f85eY9IUVjZOiNBP",
		// 							"product": "prod_SX8UbjIiMy1fxR"
		// 						},
		// 						"type": "price_details",
		// 						"unit_amount_decimal": "0"
		// 					},
		// 					"proration": false,
		// 					"proration_details": {
		// 						"credited_items": null
		// 					},
		// 					"quantity": 1,
		// 					"subscription": "sub_1RgMx4G7f85eY9IUiNOMNiF2",
		// 					"subscription_item": "si_Sba78Ox1L3yUCb",
		// 					"tax_amounts": [],
		// 					"tax_rates": [],
		// 					"taxes": [],
		// 					"type": "subscription",
		// 					"unit_amount_excluding_tax": "0"
		// 				}
		// 			],
		// 			"has_more": false,
		// 			"total_count": 1,
		// 			"url": "/v1/invoices/in_1RgMx4G7f85eY9IUeVbOLk2o/lines"
		// 		},
		// 		"livemode": false,
		// 		"metadata": {},
		// 		"next_payment_attempt": null,
		// 		"number": "F6LGL7ZE-0001",
		// 		"on_behalf_of": null,
		// 		"paid": true,
		// 		"paid_out_of_band": false,
		// 		"parent": {
		// 			"quote_details": null,
		// 			"subscription_details": {
		// 				"metadata": {},
		// 				"subscription": "sub_1RgMx4G7f85eY9IUiNOMNiF2"
		// 			},
		// 			"type": "subscription_details"
		// 		},
		// 		"payment_intent": null,
		// 		"payment_settings": {
		// 			"default_mandate": null,
		// 			"payment_method_options": null,
		// 			"payment_method_types": null
		// 		},
		// 		"period_end": 1751448458,
		// 		"period_start": 1751448458,
		// 		"post_payment_credit_notes_amount": 0,
		// 		"pre_payment_credit_notes_amount": 0,
		// 		"quote": null,
		// 		"receipt_number": null,
		// 		"rendering": null,
		// 		"shipping_cost": null,
		// 		"shipping_details": null,
		// 		"starting_balance": 0,
		// 		"statement_descriptor": null,
		// 		"status": "paid",
		// 		"status_transitions": {
		// 			"finalized_at": 1751448458,
		// 			"marked_uncollectible_at": null,
		// 			"paid_at": 1751448458,
		// 			"voided_at": null
		// 		},
		// 		"subscription": "sub_1RgMx4G7f85eY9IUiNOMNiF2",
		// 		"subscription_details": {
		// 			"metadata": {}
		// 		},
		// 		"subtotal": 0,
		// 		"subtotal_excluding_tax": 0,
		// 		"tax": null,
		// 		"test_clock": null,
		// 		"total": 0,
		// 		"total_discount_amounts": [],
		// 		"total_excluding_tax": 0,
		// 		"total_pretax_credit_amounts": [],
		// 		"total_tax_amounts": [],
		// 		"total_taxes": [],
		// 		"transfer_data": null,
		// 		"webhooks_delivered_at": 1751448458,
		// 		"level": "info",
		// 		"message": "full invoice"
		// 	};

		// 	const stripe_transaction_id = paymentdata.payment_intent;
		// 	const amount_paid = paymentdata.amount_paid;
		// return res.json(paymentdata.payment_intent)
		const endpointSecret = "whsec_1kp8GR0oIicHW9Yd57QL2dh1UpEqPYGN";
		const sig = req.headers["stripe-signature"];
		let event;
		// ✅ Verify Stripe signature
		try {
			event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
		} catch (err) {
			console.log("Webhook signature failed:", err.message);
			return res.status(400).send(`Webhook Error: ${err.message}`);
		}

		// ✅ Listen for subscription payment success
		if (event.type === "invoice.payment_succeeded") {
			const invoice = event.data.object;
			console.log("invoice data", invoice);
		}

		// You can add more event types here
		if (event.type === "invoice.payment_failed") {
			console.log("❌ Invoice payment failed");
		}

		res.status(200).send("Webhook received");
	} catch (error) {
		console.log("Webhook Handler Error:", error);
		res.status(500).json({
			message: "Internal Server Error",
			error: error.message,
		});
	}
};