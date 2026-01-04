import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { LoginRequest, LoginResponse } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthApiService {
  private readonly API_URL = environment.apiUrl + '/auth';
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'current_user';

  private currentUserSubject = new BehaviorSubject<LoginResponse | null>(this.getCurrentUser());
  public currentUser$ = this.currentUserSubject. asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Connexion
   */
  login(credentials:  LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, credentials)
      .pipe(
        tap(response => {
          // Ajouter les rôles par défaut si absents
          if (!response.roles) {
            response.roles = ['user'];  // Rôle par défaut
          }
          
          this.saveToken(response.token);
          this.saveUser(response);
          this.currentUserSubject.next(response);
          console.log('✅ Login successful, token saved, roles:', response.roles);
        })
      );
  }

  /**
   * Déconnexion
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject. next(null);
    console.log('🔓 Logout successful, token removed');
  }

  /**
   * Vérifie si l'utilisateur est authentifié
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    const isAuth = !!token;
    console.log('isAuthenticated:', isAuth);
    return isAuth;
  }

  /**
   * Récupère le token
   */
  getToken(): string | null {
    return localStorage.getItem(this. TOKEN_KEY);
  }

  /**
   * Sauvegarde le token
   */
  private saveToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Sauvegarde l'utilisateur avec ses rôles
   */
  private saveUser(user: LoginResponse): void {
    localStorage. setItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * Récupère l'utilisateur courant
   */
  getCurrentUser(): LoginResponse | null {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  /**
   * Récupère les rôles de l'utilisateur
   */
  getRoles(): string[] {
    const user = this.getCurrentUser();
    return user?.roles || ['guest'];
  }
}