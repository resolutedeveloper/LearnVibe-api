import express from 'express';
import { registerUser } from '../controllers/UserSignUp.controller';
import { plan_list } from '../controllers/plan.controller';

import { userValidationSchema } from '../validations/userValidation';
import { validateRequest } from '../middlewares/validateRequest';

const router = express.Router();

router.post('/auth/sign-up',validateRequest(userValidationSchema), registerUser);
router.post('/users/subscription-list', plan_list);
export default router;
