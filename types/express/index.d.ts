import { IUser } from '../../src/models/user.model';

declare global {
  namespace Express {
    interface Request {
      TokenUser?: IUser;
    }
  }
}

export {};
