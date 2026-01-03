import { Observable } from 'rxjs';

export interface User {
  name: string;
  picture: string;
  nick?:  string;
}

export abstract class UserData {
  abstract getUsers(): Observable<User>;
  abstract getCurrentUser(): Observable<User>;
}