import express from 'express';

import { plan_list, sign_in } from '../controllers/plan.controller';
import { userValidationSchema } from '../validations/userValidation';
import { validateRequest } from '../middlewares/validateRequest';
import { tokenVerification } from '../middlewares/tokenVerification';   // ✅ match name: tokenVerification

import { registerUser } from '../controllers/userAuth.controller';

const router = express.Router();

router.post('/auth/sign-up', validateRequest(userValidationSchema), registerUser);
router.get('/users/subscription-list', tokenVerification, plan_list);  // ✅ match name: token_verification
router.post('/auth/sign-in', sign_in);  // ✅ match name: token_verification

export default router;
