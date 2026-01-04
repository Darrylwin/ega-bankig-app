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
   * CONNEXION - Appel API
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    console.log('🔵 Calling API:', `${this.API_URL}/login`);
    console.log('📤 Credentials:', credentials);

    return this.http.post<LoginResponse>(`${this.API_URL}/login`, credentials)
      .pipe(
        tap(response => {
          console.log('📥 API Response:', response);

          // Ajouter les rôles par défaut si le backend ne les envoie pas
          if (!response.roles || response.roles.length === 0) {
            response.roles = ['user'];
            console.log('⚠️ No roles from API, using default:  [user]');
          }
          
          this.saveToken(response.token);
          this.saveUser(response);
          this.currentUserSubject.next(response);
          console.log('✅ Login successful, token saved');
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
    console.log('🔓 Logout successful');
  }

  /**
   * Vérifie si l'utilisateur est authentifié
   */
  isAuthenticated(): boolean {
    const token = this. getToken();
    return !!token;
  }

  /**
   * Récupère le token
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Sauvegarde le token
   */
  private saveToken(token:  string): void {
    localStorage. setItem(this.TOKEN_KEY, token);
  }

  /**
   * Sauvegarde l'utilisateur
   */
  private saveUser(user: LoginResponse): void {
    localStorage.setItem(this. USER_KEY, JSON.stringify(user));
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
    const user = this. getCurrentUser();
    return user?.roles || ['guest'];
  }
}