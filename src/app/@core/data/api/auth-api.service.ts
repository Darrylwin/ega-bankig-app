import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import {
  LoginRequest,
  AuthResponse,
  UserProfile,
  ChangePasswordRequest,
  CreateAdminRequest,
} from '../models';

/**
 * Service API pour l'authentification
 * Gère login, profil, changement de mot de passe
 */
@Injectable({
  providedIn: 'root',
})
export class AuthApiService {

  constructor(private apiService: ApiService) {}

  /**
   * POST /api/auth/login
   * Connecte un utilisateur
   * 
   * . pipe(tap(... )) permet d'exécuter du code quand on reçoit la réponse
   * sans modifier la réponse elle-même
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('/auth/login', credentials).pipe(
      tap((response: AuthResponse) => {
        // Stocke le token dans le localStorage pour les prochaines requêtes
        localStorage.setItem('token', response.token);
        
        // Stocke aussi les infos utilisateur (optionnel)
        localStorage.setItem('user', JSON.stringify({
          id: response.id,
          username: response.username,
          email: response.email,
          roles: response.roles,
        }));
      }),
    );
  }

  /**
   * GET /api/auth/me
   * Récupère le profil de l'utilisateur connecté
   */
  getProfile(): Observable<UserProfile> {
    return this.apiService.get<UserProfile>('/auth/me');
  }

  /**
   * PUT /api/auth/change-password
   * Change le mot de passe de l'utilisateur connecté
   */
  changePassword(data: ChangePasswordRequest): Observable<string> {
    return this.apiService.put<string>('/auth/change-password', data);
  }

  /**
   * POST /api/auth/admin/create
   * Crée un nouvel administrateur (ADMIN uniquement)
   */
  createAdmin(data: CreateAdminRequest): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('/auth/admin/create', data);
  }

  /**
   * Déconnexion
   * Supprime le token et les infos utilisateur du localStorage
   */
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  /**
   * Vérifie si l'utilisateur est connecté
   * @returns true si un token existe
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  /**
   * Récupère les infos utilisateur stockées localement
   * @returns Les infos utilisateur ou null
   */
  getCurrentUser(): any {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Vérifie si l'utilisateur a un rôle spécifique
   * @param role - Le rôle à vérifier (ex: 'ROLE_ADMIN')
   */
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user && user.roles && user.roles.includes(role);
  }

  /**
   * Vérifie si l'utilisateur est admin
   */
  isAdmin(): boolean {
    return this.hasRole('ROLE_ADMIN');
  }
}