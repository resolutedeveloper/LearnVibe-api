import express from 'express';
import { registerUser } from '../controllers/UserSignUp.controller';

import { userValidationSchema } from '../validations/userValidation';
import { validateRequest } from '../middlewares/validateRequest';

const router = express.Router();

router.post('/auth/sign-up',validateRequest(userValidationSchema), registerUser);

export default router;
