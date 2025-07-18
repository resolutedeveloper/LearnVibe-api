import express from 'express';
import userRoutes from './user.routes';
import authRoutes from './auth.routes';
import adminSubscriptionRoutes from './adminSubscription.routes'; import adminUsers from './adminUsers.routes';

const router = express.Router();

// Group all routes here
router.use('/users', userRoutes); // Prefix: /user
router.use('/auth', authRoutes); // Prefix: /user
router.use('/admin', adminUsers); // Prefix: /user
router.use('/admin-subscription', adminSubscriptionRoutes);  // Prefix: /user

export default router;
