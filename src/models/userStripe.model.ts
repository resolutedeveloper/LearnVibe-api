import mongoose, { Schema, Document } from 'mongoose';

export interface IUserStripe extends Document {
  EmailID: string;
  UserID: mongoose.Types.ObjectId;
  StripeCustomerID: string;
}

const UserStripeSchema: Schema = new Schema(
  {
    EmailID: { type: String, required: true },
    UserID: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    StripeCustomerID: { type: String, required: true },
  },
  {
    timestamps: true, // This will automatically create createdAt and updatedAt fields
  }
);

export default mongoose.model<IUserStripe>('UserStripe', UserStripeSchema);
