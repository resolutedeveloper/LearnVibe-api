import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
// export const generateToken = (userId: string): string => {
//   return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '1d' });
// };
export const generateToken = (user: any): string => {
const { _id, FirstName, LastName, EmailID, ContactNumber, Birthdate, Grade, CreatedBy, LastModifiedBy, CreatedOn, LastModifiedOn } = user;
const payload = { _id, FirstName, LastName, EmailID, ContactNumber, Birthdate, Grade, CreatedBy, LastModifiedBy, CreatedOn, LastModifiedOn };
return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '1d' });
};