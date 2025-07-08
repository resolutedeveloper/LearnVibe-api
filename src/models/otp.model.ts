import mongoose, { Schema, Document } from 'mongoose';

export interface IOTP extends Document {
  EmailID: string;
  OTP: string;
  Status: number; // 0 or 1
  Timestamp: Date;
  VerificationTimestamp?: Date;
  ExpirationTimestamp: Date;
  InactiveTimestamp?: Date;
}

const OTPSchema: Schema = new Schema({
  EmailID: {
    type: String,
    required: true,
  },
  OTP: {
    type: String,
    required: true,
  },
  Status: {
    type: Number,
    enum: [-1, 0, 1],
    default: 0,
  },
  Timestamp: {
    type: Date,
    default: () => new Date(),
  },
  VerificationTimestamp: {
    type: Date,
    default: null,
  },
  ExpirationTimestamp: {
    type: Date,
    required: true,
  },
  InactiveTimestamp: {
    type: Date,
    default: null,
  },
});

export default mongoose.model<IOTP>('OTP', OTPSchema);
