import mongoose, { Schema, Document } from 'mongoose';

export interface IUserDocument extends Document {
  UserID: mongoose.Types.ObjectId;
  SubscriptionID: mongoose.Types.ObjectId;
  DocumentName: string;
  DocumentUploadDateTime: Date;
  Status: number;
}

const UserDocumentSchema: Schema = new Schema(
  {
    UserID: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    SubscriptionID: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Subscription' },
    DocumentName: { type: String, required: true },
    DocumentUploadDateTime: { type: Date, default: Date.now },
    Status: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IUserDocument>('UserDocument', UserDocumentSchema);
