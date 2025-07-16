import express from 'express';
import {
  plan_list,
  get_active_documents,
  document_upload,
  subscribe,
  payment_detail,
  quiz_pause_complete,
  user_history,
} from '../controllers/plan.controller';
import { tokenVerification } from '../middlewares/tokenVerification'; // ✅ match name: tokenVerification
import { upload } from '../middlewares/multerConfig';

import { subscriptionValidationSchema } from '../validations/subscribeValidation';
import { QuizPauseCompleteValidationSchema,uploadValidationSchema } from '../validations/QuizPauseCompleteValidation';

import { validateRequest } from '../middlewares/validateRequest';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();
router.get('/subscription-list', tokenVerification, asyncHandler(plan_list)); // ✅ match name: token_verification
router.get('/get-active-documents', tokenVerification, asyncHandler(get_active_documents)); // ✅ match name: token_verification
router.get('/history', tokenVerification, asyncHandler(user_history));
router.post(
  '/document-upload',
  validateRequest(uploadValidationSchema),
  upload.single('file'),
  tokenVerification,
  asyncHandler(document_upload)
); // ✅ match name: token_verification
router.post(
  '/subscribe',
  validateRequest(subscriptionValidationSchema),
  tokenVerification,
  asyncHandler(subscribe)
); // ✅ match name: token_verification
router.post('/payment-detail', tokenVerification, asyncHandler(payment_detail));
router.post(
  '/quiz-pause-complete',
  validateRequest(QuizPauseCompleteValidationSchema),
  tokenVerification,
  asyncHandler(quiz_pause_complete)
);

export default router;
