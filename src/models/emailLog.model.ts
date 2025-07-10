import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailLog extends Document {
  EmailID: string;
  Subject: string;
  Body: string;
  Timestamp: Date;
}

const EmailLogSchema: Schema = new Schema({
  EmailID: {
    type: String,
    required: true,
  },
  Subject: {
    type: String,
    required: true,
  },
  Body: {
    type: String,
    required: true,
  },
  Timestamp: {
    type: Date,
    default: () => new Date(),
  },
});

export default mongoose.model<IEmailLog>('EmailLog', EmailLogSchema);
