import express from 'express';
import { subscription,subscription_update,getSubscriptionById,getAllSubscriptions, permanentDeleteSubscription} from '../controllers/subscriptionplan.controller';
import { tokenVerification } from '../middlewares/tokenVerification'; // ✅ match name: tokenVerification
import { AddSubscriptionValidationSchema } from '../validations/subscriptionPlanValidation';
import { asyncHandler } from '../utils/asyncHandler';
import { validateRequest } from '../middlewares/validateRequest';
const router = express.Router();
router.post('/', validateRequest(AddSubscriptionValidationSchema),tokenVerification, asyncHandler(subscription));
router.put('/:id', validateRequest(AddSubscriptionValidationSchema),tokenVerification, asyncHandler(subscription_update));
router.get('/:id', tokenVerification, asyncHandler(getSubscriptionById));
router.get('/', tokenVerification, asyncHandler(getAllSubscriptions));
router.delete('/:id', tokenVerification, asyncHandler(permanentDeleteSubscription));
export default router;
