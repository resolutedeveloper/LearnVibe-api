import { Request, Response } from 'express';
import User from '../models/user.model';
import { DecryptBE, DecryptFE, EncryptBE } from '../utils/encrypt';

export const updateUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Step 1: Use UserID directly (not encrypted)
    const userID = req.body.UserID;

    const { FirstName, EmailID } = req.body;

    // Step 3: Use remaining fields as plain text
    const lastName = req.body.LastName ?? null;
    const contactNumber = req.body.ContactNumber ?? null;
    const birthDate = req.body.BirthDate ?? null;
    const grade = req.body.Grade ?? null;

    // Step 4: Build update object for main User table
    const updateData: any = {
      FirstName: EncryptBE(FirstName),
      EmailID: EncryptBE(EmailID),
      LastModifiedOn: new Date(),
      LastModifiedBy: DecryptFE(FirstName),
    };

    if (lastName !== null) updateData.LastName = EncryptBE(lastName);
    if (contactNumber !== null) updateData.ContactNumber = EncryptBE(contactNumber);
    if (birthDate !== null) updateData.Birthdate = EncryptBE(birthDate);
    if (grade !== null) updateData.Grade = EncryptBE(grade);

    // Step 5: Update main User table
    const updatedUser = await User.findByIdAndUpdate(userID, updateData, { new: true });

    if (!updatedUser) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    // Step 7: Send decrypted fields in response
    return res.status(200).json({
      status: 'success',
      message: 'Profile updated',
      data: {
        UserID: updatedUser._id,
        FirstName: FirstName,
        LastName: updatedUser.LastName ? DecryptBE(updatedUser.LastName) : '',
        EmailID: EmailID,
        ContactNumber: updatedUser.ContactNumber ? DecryptBE(updatedUser.ContactNumber) : '',
        BirthDate: updatedUser.Birthdate ? DecryptBE(updatedUser.Birthdate) : '',
        Grade: updatedUser.Grade ? DecryptBE(updatedUser.Grade) : '',
      },
    });
  } catch (error) {
    console.error('Update error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal Server Error',
    });
  }
};
