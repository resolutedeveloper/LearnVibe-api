import mongoose, { Schema, Document } from 'mongoose';

// 1. Define the TypeScript interface
export interface ISubscription extends Document {
  SubscriptionTitle: string;
  Duration: number;
  NumOfDocuments: number;
  NumOfQuiz: number;
  AllowedFormats: string;
  NumberOfQuest: string;
  DifficultyLevels: string;
  NoOfPages: number;
  IsActive: boolean;
  IsDefault: boolean;
  CreatedOn: Date;
  CreatedBy: string;
  LastModifiedOn: Date;
  LastModifiedBy: string;
}

// 2. Define the Mongoose Schema
const SubscriptionSchema: Schema = new Schema<ISubscription>({
  SubscriptionTitle: { type: String, required: true },
  Duration: { type: Number, required: true },
  NumOfDocuments: { type: Number, required: true },
  NumOfQuiz: { type: Number, required: true },
  AllowedFormats: { type: String, required: true },
  NumberOfQuest: { type: String, required: true },
  DifficultyLevels: { type: String, required: true },
  NoOfPages: { type: Number, required: true },
  IsActive: { type: Boolean, required: true },
  IsDefault: { type: Boolean, required: true },
  CreatedOn: { type: Date, required: true },
  CreatedBy: { type: String, required: true },
  LastModifiedOn: { type: Date, required: true },
  LastModifiedBy: { type: String, required: true },
});

// 3. Create and Export the Model
export const Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
