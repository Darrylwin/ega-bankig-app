import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { User, UserData } from '../data/users';

@Injectable()
export class UsersService extends UserData {
  private users = {
    nick: { name: 'Admin User', picture: 'assets/images/avatar.png' },
  };

  getUsers(): Observable<any> {
    return of(this.users);
  }

  getCurrentUser(): Observable<User> {
    return of(this.users.nick);
  }
}