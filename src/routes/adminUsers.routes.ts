import express from 'express';
import { validateRequest } from '../middlewares/validateRequest';
import { tokenVerification } from '../middlewares/tokenVerification';
import {
  getUser,
  getUserById,
  addUser,
  updateUser,
  deleteUser,
} from '../controllers/adminUser.controller';
import { addAdminUser } from '../validations/adminUsersValidations';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

// ✅ GET all sub-admins
router.get('/get-user', tokenVerification, asyncHandler(getUser));

// ✅ GET a specific sub-admin by ID
router.get('/get-user/:id', tokenVerification, asyncHandler(getUserById));

// ✅ ADD a new sub-admin
router.post('/add-user', tokenVerification, validateRequest(addAdminUser), asyncHandler(addUser));

// ✅ UPDATE an existing sub-admin
router.put(
  '/update-user/:id',
  tokenVerification,
  validateRequest(addAdminUser), // Reuse schema if same fields are updated
  asyncHandler(updateUser)
);

// ✅ DELETE a sub-admin
router.delete('/delete-user/:id', tokenVerification, asyncHandler(deleteUser));

export default router;
