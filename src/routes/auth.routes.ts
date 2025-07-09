import express from 'express';

import { userValidationSchema, userUpdateValidationSchema } from '../validations/userValidation';
import { validateRequest } from '../middlewares/validateRequest';
import { tokenVerification } from '../middlewares/tokenVerification'; // ✅ match name: tokenVerification

import { registerUser,sign_in } from '../controllers/userAuth.controller';
import { updateUser } from '../controllers/users.controller';

const router = express.Router();

router.post('/sign-up', validateRequest(userValidationSchema), registerUser);
router.post('/update-profile', validateRequest(userUpdateValidationSchema), updateUser);
router.post('/sign-in', sign_in);  // ✅ match name: token_verification
export default router;
