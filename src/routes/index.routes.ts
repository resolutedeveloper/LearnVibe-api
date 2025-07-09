import express from 'express';
import userRoutes from './user.routes';  
import authRoutes from './auth.routes'; 

const router = express.Router();

// Group all routes here
router.use('/users', userRoutes);  // Prefix: /user
router.use('/auth', authRoutes);  // Prefix: /user

export default router;
