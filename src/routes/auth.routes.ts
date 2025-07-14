import express from 'express';

import { userValidationSchema, userUpdateValidationSchema } from '../validations/userValidation';
import { validateRequest } from '../middlewares/validateRequest';
import { tokenVerification } from '../middlewares/tokenVerification'; // ✅ match name: tokenVerification

import { registerUser, sendOtp, sign_in, verifyOtp } from '../controllers/UserAuth.controller';
import { updateUser } from '../controllers/users.controller';
import { verifyOtpValidationSchema } from '../validations/otpValidations';

const router = express.Router();

router.post('/sign-up', validateRequest(userValidationSchema), registerUser);
router.post('/update-profile', validateRequest(userUpdateValidationSchema), updateUser);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', validateRequest(verifyOtpValidationSchema), verifyOtp);
router.post('/sign-in', sign_in); // ✅ match name: token_verification
export default router;
