import { IUser } from '../../src/models/user.model';

declare namespace Express {
  export interface Request {
    TokenUser?: IUser;
  }
}
