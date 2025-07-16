import mongoose, { Schema, Document } from 'mongoose';

export interface IUserDocument extends Document {
  UsersSubscriptionID: mongoose.Types.ObjectId;
  UserID: mongoose.Types.ObjectId;
  SubscriptionID: mongoose.Types.ObjectId;
  DocumentName: string;
  UploadedDocumentName:string;
  DocumentUploadDateTime: Date;
  Status: number;
}

const UserDocumentSchema: Schema = new Schema(
  {
    UsersSubscriptionID: { type: String, required: true, ref: 'UserSubscription' },
    UserID: { type: String, required: true, ref: 'User' },
    SubscriptionID: { type: String, required: true, ref: 'Subscription' },
    DocumentName: { type: String, required: true },
    UploadedDocumentName: { type: String, required: true },
    DocumentUploadDateTime: { type: Date, default: Date.now },
    Status: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IUserDocument>('UserDocument', UserDocumentSchema);
