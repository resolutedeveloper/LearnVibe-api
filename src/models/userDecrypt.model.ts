import mongoose, { Schema, Document } from 'mongoose';

export interface IUserDecrypt extends Document {
  ID: string;
  User_id: string;
  EmailID: string;
  Password_Hash: string;
  CreatedOn: string;
  CreatedBy: string;
  LastModifiedOn: string;
  LastModifiedBy: string;
}

const UserDecryptSchema: Schema<IUserDecrypt> = new Schema(
  {
    User_id: {
      type: String,
      required: true,
    },
    EmailID: {
      type: String,
      required: true,
    },
    Password_Hash: {
      type: String,
      required: true,
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

export default mongoose.model<IUserDecrypt>('UserDecrypt', UserDecryptSchema);
