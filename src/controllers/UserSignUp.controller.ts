import { Request, Response } from 'express';
import { connectDB } from '../db/database';
import { User } from '../models/user.model';
import { DataEncrypted } from '../utils/encrypt';
import { generateToken } from '../utils/jwt';
import { v4 as uuidv4 } from 'uuid';

export const registerUser = async (req: Request, res: Response) => {
  try {
    const db = await connectDB();
    const collection = db.collection<User>('users');

    const {
      FirstName,
      LastName,
      EmailID,
      Password,
      ContactNumber,
      Birthdate,
      Grade
    } = req.body;

    const FirstNameEncrypted = await DataEncrypted(FirstName);
    const EmailIDEncrypted = await DataEncrypted(EmailID);
    const PasswordEncrypted = await DataEncrypted(Password);

    const timestamp = new Date().toISOString();
    const user: User = {
      ID: uuidv4(),
      FirstName,
      LastName : FirstNameEncrypted,
      EmailID : EmailIDEncrypted,
      Password: PasswordEncrypted,
      ContactNumber,
      Birthdate,
      Grade,
      CreatedOn: timestamp,
      CreatedBy: FirstName,
      LastModifiedOn: timestamp,
      LastModifiedBy: FirstName
    };

    await collection.insertOne(user);

    const token = generateToken(user.ID);

    res.status(201).json({ status: 'success', message: 'User created', token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};
