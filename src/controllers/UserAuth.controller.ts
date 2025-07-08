import { Request, Response } from 'express';
import { decrypt, encrypt } from '../utils/encrypt';
import { generateToken } from '../utils/jwt'; // maybe use this later
import User from '../models/user.model';

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Decrypt incoming fields
    const FirstName = decrypt(req.body.FirstName);
    const EmailID = decrypt(req.body.EmailID);
    const Password = decrypt(req.body.Password);

    const encryptedEmail = encrypt(EmailID);

    // 2. Check if user already exists
    const existingUser = await User.findOne({ EmailID: encryptedEmail });
    if (existingUser) {
      res.status(409).json({ message: 'User already exists' });
      return;
    }

    // 3. Encrypt password and create user
    const encryptedPassword = encrypt(Password);

    const user = new User({
      FirstName: encrypt(FirstName),
      EmailID: encryptedEmail,
      Password: encryptedPassword,
      CreatedBy: FirstName,
      LastModifiedBy: FirstName,
    });

    // 4. Save user
    await user.save();

    // 5. create token
    const token = await generateToken(user._id as string);

    // 6. Respond
    res.status(200).json({
      ID: user._id,
      FirstName,
      EmailID,
      LoginToken: token,
      SubscriptionDetails: {
        SubscriptionID: '0bb11864-9625-4173-99ac-8e679b9d47d0',
        StartDate: '2019-08-24',
        EndDate: '2019-08-24',
        ExhaustDate: '2019-08-24',
        ActualEndDate: '2019-08-24',
        PaymentAmount: 0,
        PaymentDuration: 0,
        PaymentCurrency: 'string',
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
