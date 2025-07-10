import express from 'express';
import { plan_list,get_active_documents,document_upload, subscribe, payment_detail,quiz_pause_complete} from '../controllers/plan.controller';
import { tokenVerification } from '../middlewares/tokenVerification'; // ✅ match name: tokenVerification
import { upload } from '../middlewares/multerConfig';

import { subscriptionValidationSchema } from '../validations/subscribeValidation';
import { QuizPauseCompleteValidationSchema } from '../validations/QuizPauseCompleteValidation';

import { validateRequest } from '../middlewares/validateRequest';

const router = express.Router();
router.get('/subscription-list', tokenVerification, plan_list); // ✅ match name: token_verification
router.get('/get-active-documents', tokenVerification, get_active_documents); // ✅ match name: token_verification
router.post('/document-upload', upload.single('file'), tokenVerification, document_upload); // ✅ match name: token_verification
router.post('/subscribe',  validateRequest(subscriptionValidationSchema),tokenVerification, subscribe); // ✅ match name: token_verification
router.post('/payment-detail', tokenVerification, payment_detail); 
router.post('/quiz-pause-complete', validateRequest(QuizPauseCompleteValidationSchema), tokenVerification, quiz_pause_complete); 


export default router;
