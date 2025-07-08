import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
export interface IUser extends Document {
  ID: string;
  FirstName: string;
  LastName: string;
  EmailID: string;
  Password: string;
  ContactNumber?: string;
  Birthdate?: string;
  Grade?: string;
  CreatedOn: string;
  CreatedBy: string;
  LastModifiedOn: string;
  LastModifiedBy: string;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    _id: {
      type: String,
      required: true,
      default: uuidv4,
      unique: true,
    },
    FirstName: {
      type: String,
      required: true,
    },
    LastName: {
      type: String,
      default: null,
    },
    EmailID: {
      type: String,
      required: true,
    },
    Password: {
      type: String,
      required: true,
    },
    ContactNumber: {
      type: String,
      default: null,
    },
    Birthdate: {
      type: String,
      default: null,
    },
    Grade: {
      type: String,
      default: null,
    },
    CreatedBy: {
      type: String,
      required: true,
    },
    LastModifiedBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: { createdAt: 'CreatedOn', updatedAt: 'LastModifiedOn' },
  }
);

export default mongoose.model<IUser>('User', UserSchema);
