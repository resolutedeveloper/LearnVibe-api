import { Request, Response } from 'express';
import User from '../models/user.model';
import { DecryptFE, EncryptBE } from '../utils/encrypt';

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // Step 1: Use UserID directly (not encrypted)
    const userID = req.body.UserID;

    const decryptedFirstName = DecryptFE(req.body.FirstName);
    const decryptedEmailID = DecryptFE(req.body.EmailID);

    // Step 3: Use remaining fields as plain text
    const lastName = req.body.LastName ?? null;
    const contactNumber = req.body.ContactNumber ?? null;
    const birthDate = req.body.BirthDate ?? null;
    const grade = req.body.Grade ?? null;

    // Step 4: Build update object for main User table
    const updateData: any = {
      FirstName: EncryptBE(req.body.FirstName),
      EmailID: EncryptBE(req.body.EmailID),
      LastModifiedOn: new Date(),
      LastModifiedBy: DecryptFE(req.body.FirstName),
    };

    if (lastName !== null) updateData.LastName = lastName;
    if (contactNumber !== null) updateData.ContactNumber = contactNumber;
    if (birthDate !== null) updateData.Birthdate = birthDate;
    if (grade !== null) updateData.Grade = grade;

    // Step 5: Update main User table
    const updatedUser = await User.findByIdAndUpdate(userID, updateData, { new: true });

    if (!updatedUser) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    // Step 7: Send decrypted fields in response
    res.status(200).json({
      status: 'success',
      UserID: updatedUser._id,
      FirstName: decryptedFirstName,
      LastName: updatedUser.LastName || '',
      EmailID: decryptedEmailID,
      ContactNumber: updatedUser.ContactNumber || '',
      BirthDate: updatedUser.Birthdate || '',
      Grade: updatedUser.Grade || '',
    });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal Server Error',
    });
  }
};
