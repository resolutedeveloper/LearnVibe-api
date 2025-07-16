import express, { RequestHandler } from 'express';

import { userValidationSchema, userUpdateValidationSchema, signinValidationSchema } from '../validations/userValidation';
import { validateRequest } from '../middlewares/validateRequest';
import { tokenVerification } from '../middlewares/tokenVerification'; // ✅ match name: tokenVerification

import {
  registerUser,
  sendOtp,
  sign_in,
  verifyOtp,
  webhook_payment,
} from '../controllers/UserAuth.controller';
import { updateUser } from '../controllers/users.controller';
import { verifyOtpValidationSchema } from '../validations/otpValidations';
import { asyncHandler } from '../utils/asyncHandler';

import bodyParser from 'body-parser';

const router = express.Router();

router.post('/sign-up', validateRequest(userValidationSchema), asyncHandler(registerUser));
router.post(
  '/update-profile',
  validateRequest(userUpdateValidationSchema),
  asyncHandler(updateUser)
);
router.post('/send-otp', asyncHandler(sendOtp));
router.post('/verify-otp', validateRequest(verifyOtpValidationSchema), asyncHandler(verifyOtp));
router.post('/sign-in', validateRequest(signinValidationSchema), asyncHandler(sign_in)); // ✅ match name: token_verification
router.post(
  '/webhook-payment',
  bodyParser.raw({ type: 'application/json' }), // ✅ correct
  asyncHandler(webhook_payment)
);
export default router;
