import express from 'express';
import { plan_list } from '../controllers/plan.controller';
import { tokenVerification } from '../middlewares/tokenVerification'; // ✅ match name: tokenVerification
const router = express.Router();
router.get('/subscription-list', tokenVerification, plan_list); // ✅ match name: token_verification
export default router;
