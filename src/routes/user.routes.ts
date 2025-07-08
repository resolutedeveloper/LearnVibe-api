import express from 'express';

import { userValidationSchema } from '../validations/userValidation';
import { validateRequest } from '../middlewares/validateRequest';
import { registerUser } from '../controllers/UserAuth.controller';

const router = express.Router();

router.post('/auth/sign-up',validateRequest(userValidationSchema), registerUser);

export default router;
