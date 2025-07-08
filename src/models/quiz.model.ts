import mongoose, { Schema, Document } from 'mongoose';

export interface IQuiz extends Document {
  DocumentID: mongoose.Types.ObjectId;
  QuizJSON: any;
  QuizResponseJSON: any;
  Score: number;
  Status: number;
  Priority: number;
}

const QuizSchema: Schema = new Schema(
  {
    DocumentID: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'UserDocument' },
    QuizJSON: { type: Schema.Types.Mixed, required: true },
    QuizResponseJSON: { type: Schema.Types.Mixed, default: {} },
    Score: { type: Number, required: true },
    Status: { type: Number, required: true },
    Priority: { type: Number, default: 1 },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IQuiz>('Quiz', QuizSchema);
