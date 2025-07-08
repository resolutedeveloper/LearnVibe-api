import express from 'express';

import { plan_list } from '../controllers/plan.controller';
import { userValidationSchema, userUpdateValidationSchema } from '../validations/userValidation';
import { validateRequest } from '../middlewares/validateRequest';
import { tokenVerification } from '../middlewares/tokenVerification'; // ✅ match name: tokenVerification

import { registerUser } from '../controllers/userAuth.controller';
import { updateUser } from '../controllers/users.controller';

const router = express.Router();

router.post('/auth/sign-up', validateRequest(userValidationSchema), registerUser);
router.post('/auth/update-profile', validateRequest(userUpdateValidationSchema), updateUser);
router.get('/users/subscription-list', tokenVerification, plan_list); // ✅ match name: token_verification

export default router;
