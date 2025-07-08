import mongoose, { Schema, Document } from 'mongoose';

export interface IUserLogin extends Document {
  UserID: mongoose.Types.ObjectId;
  DateTime: Date;
  OS: string;
  Browser: string;
}

const UserLoginSchema: Schema = new Schema({
  UserID: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  DateTime: { type: Date, required: true },
  OS: { type: String, required: true },
  Browser: { type: String, required: true },
});

const UserLogin = mongoose.model<IUserLogin>('UserLogin', UserLoginSchema);
export default UserLogin;
