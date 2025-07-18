import { Request, Response } from 'express';
import User from '../models/user.model';
import { DecryptBE, DecryptFE, EncryptBE } from '../utils/encrypt';

const sensitiveFields = [
  'FirstName',
  'LastName',
  'EmailID',
  'Password',
  'ContactNumber',
  'Birthdate',
  'Address',
  'Grade',
];

const encryptBEFields = (data: any) => {
  const encrypted: any = { ...data };
  for (const field of sensitiveFields) {
    if (encrypted[field]) {
      encrypted[field] = EncryptBE(encrypted[field]);
    }
  }
  return encrypted;
};

const decryptBEFields = (doc: any) => {
  const decrypted: any = { ...(doc._doc || doc) };
  for (const field of sensitiveFields) {
    if (decrypted[field]) {
      decrypted[field] = DecryptBE(decrypted[field]);
    }
  }
  return decrypted;
};

// GET all users (only sub-admins)
export const getUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const page = parseInt(req.query.page as string) || 1;
    const skip = (page - 1) * limit;

    const users = await User.find({ Role: 'sub-admin' })
      .skip(skip)
      .limit(limit)
      .sort({ CreatedOn: -1 });

    const total = await User.countDocuments({ Role: 'sub-admin' });
    const decryptedUsers = users.map(decryptBEFields);

    return res.status(200).json({
      status: 'success',
      message: 'Sub-admin users fetched successfully',
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalUsers: total,
      users: decryptedUsers,
    });
  } catch (error) {
    console.error('Fetch error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal Server Error',
    });
  }
};

// GET user by ID (only if the user is sub-admin)
export const getUserById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ _id: id, Role: 'sub-admin' });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Sub-admin user not found',
      });
    }

    const decrypted = decryptBEFields(user);

    return res.status(200).json({
      status: 'success',
      message: 'Sub-admin user fetched successfully',
      data: decrypted,
    });
  } catch (error) {
    console.error('Fetch by ID error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal Server Error',
    });
  }
};

// ADD new user (must have Role as sub-admin)
export const addUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const incoming = req.body;

    const encryptedEmail = EncryptBE(incoming.EmailID);
    const existingUser = await User.findOne({ EmailID: encryptedEmail });

    if (existingUser) {
      return res.status(409).json({
        status: 'error',
        message: 'User with this EmailID already exists',
      });
    }

    const encryptedData = encryptBEFields(incoming);
    const newUser = await User.create({
      ...encryptedData,
      Role: 'sub-admin',
      CreatedBy: DecryptFE(req.body.FirstName),
      LastModifiedBy: DecryptFE(req.body.FirstName),
    });
    const decrypted = decryptBEFields(newUser);

    return res.status(201).json({
      status: 'success',
      message: 'Sub-admin user created successfully',
      data: decrypted,
    });
  } catch (error) {
    console.error('Add error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal Server Error',
    });
  }
};

// UPDATE user (only if existing user is sub-admin)
export const updateUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const incoming = req.body;

    const existingUser = await User.findOne({ _id: id, Role: 'sub-admin' });
    if (!existingUser) {
      return res.status(404).json({
        status: 'error',
        message: 'Sub-admin user not found',
      });
    }

    const encryptedData = encryptBEFields(incoming);

    const updatedUser = await User.findByIdAndUpdate(id, encryptedData, { new: true });
    const decrypted = decryptBEFields(updatedUser);

    return res.status(200).json({
      status: 'success',
      message: 'Sub-admin user updated successfully',
      data: decrypted,
    });
  } catch (error) {
    console.error('Update error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal Server Error',
    });
  }
};

// DELETE user (only if user is sub-admin)
export const deleteUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ _id: id, Role: 'sub-admin' });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Sub-admin user not found',
      });
    }

    await User.findByIdAndDelete(id);

    return res.status(200).json({
      status: 'success',
      message: 'Sub-admin user deleted successfully',
    });
  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal Server Error',
    });
  }
};
