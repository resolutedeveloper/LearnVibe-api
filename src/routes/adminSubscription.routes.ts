import express from 'express';
import { subscription } from '../controllers/subscriptionplan.controller';
import { tokenVerification } from '../middlewares/tokenVerification'; // ✅ match name: tokenVerification
import { AddSubscriptionValidationSchema } from '../validations/subscriptionPlanValidation';
import { asyncHandler } from '../utils/asyncHandler';
import { validateRequest } from '../middlewares/validateRequest';
const router = express.Router();
router.post('/', validateRequest(AddSubscriptionValidationSchema),tokenVerification, asyncHandler(subscription));

export default router;
