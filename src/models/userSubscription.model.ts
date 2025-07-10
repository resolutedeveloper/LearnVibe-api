import mongoose, { Schema, Document } from 'mongoose';

// 1. TypeScript Interface
export interface IUserSubscription extends Document {
  UserID: string; // UUID
  SubscriptionID: string; // UUID
  StartDate: string; // Date (YYYY-MM-DD)
  EndDate: string; // Date (YYYY-MM-DD)
  ExhaustDate?: string | null; // Date or null
  ActualEndDate?: string | null; // Date or null
  PaymentAmount: number; // Amount paid
  PaymentCurrency: string; // Currency (USD, INR, etc.)
  CreatedOn: string; // ISO Date-Time
  CreatedBy: string; // Name of creator
  LastModifiedOn: string; // ISO Date-Time
  LastModifiedBy: string; // Name of modifier
  PaymentDuration: number; // Duration in months
  Status: number; // 0 = Expired, 1 = Active, 2 = Exhausted
  TransactionID: string; // Payment Transaction ID
  PaymentGatewayData: any | null ; // Additional data
}

// 2. Mongoose Schema
const UserSubscriptionSchema: Schema = new Schema<IUserSubscription>({
  UserID: { type: String, required: true },
  SubscriptionID: { type: String, required: true },
  StartDate: { type: String, required: true }, // storing as ISO string
  EndDate: { type: String, required: true },
  ExhaustDate: { type: String, default: null },
  ActualEndDate: { type: String, default: null },
  PaymentAmount: { type: Number, required: true },
  PaymentCurrency: { type: String, required: true },
  CreatedOn: { type: String, required: true },
  CreatedBy: { type: String, required: true },
  LastModifiedOn: { type: String, required: true },
  LastModifiedBy: { type: String, required: true },
  PaymentDuration: { type: Number, required: true },
  Status: { type: Number, required: true }, // 0 = Expired, 1 = Active, 2 = Exhausted
  TransactionID: { type: String, required: true },
  PaymentGatewayData: { type: Schema.Types.Mixed, required: true },
});

// 3. Model Export
export const UserSubscription = mongoose.model<IUserSubscription>(
  'UserSubscription',
  UserSubscriptionSchema
);
