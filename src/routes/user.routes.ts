import express from 'express';

import { plan_list } from '../controllers/plan.controller';
import { userValidationSchema } from '../validations/userValidation';
import { validateRequest } from '../middlewares/validateRequest';
import { registerUser } from '../controllers/userAuth.controller';

const router = express.Router();

router.post('/auth/sign-up',validateRequest(userValidationSchema), registerUser);
router.post('/users/subscription-list', plan_list);
export default router;
