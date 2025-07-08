import { Request, Response } from 'express';
import User from '../models/user.model';
import { decrypt, encrypt } from '../utils/encrypt';

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Decrypt incoming fields
    const UserID = decrypt(req.body.UserID);
    const FirstName = decrypt(req.body.FirstName);
    const EmailID = decrypt(req.body.EmailID);
    const LastName = req.body.LastName ? decrypt(req.body.LastName) : null;
    const ContactNumber = req.body.ContactNumber ? decrypt(req.body.ContactNumber) : null;
    const BirthDate = req.body.BirthDate ? decrypt(req.body.BirthDate) : null;
    const Grade = req.body.Grade ? decrypt(req.body.Grade) : null;

    // 3. Encrypt fields to update
    const updateData: any = {
      FirstName: encrypt(FirstName),
      EmailID: encrypt(EmailID),
      LastModifiedOn: new Date(), // Step 7
    };

    if (LastName !== null) updateData.LastName = encrypt(LastName);
    if (ContactNumber !== null) updateData.ContactNumber = encrypt(ContactNumber);
    if (BirthDate !== null) updateData.BirthDate = encrypt(BirthDate);
    if (Grade !== null) updateData.Grade = encrypt(Grade);

    // 5. Update the user (CreatedOn and CreatedBy will not be touched)
    const user = await User.findByIdAndUpdate(UserID, updateData, { new: true });

    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    // 9. Decrypt updated user before sending response
    res.status(200).json({
      status: 'success',
      UserID: user._id,
      FirstName: decrypt(user.FirstName),
      LastName: user.LastName ? decrypt(user.LastName) : '',
      EMailID: decrypt(user.EmailID),
      ContactNumber: user.ContactNumber ? decrypt(user.ContactNumber) : '',
      BirthDate: user.Birthdate ? decrypt(user.Birthdate) : '',
      Grade: user.Grade ? decrypt(user.Grade) : '',
    });
  } catch (error) {
    console.error('error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal Server Error',
    });
  }
};
