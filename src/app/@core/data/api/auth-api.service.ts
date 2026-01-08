import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, BehaviorSubject} from 'rxjs';
import {tap} from 'rxjs/operators';
import {environment} from '../../../../environments/environment';
import {LoginRequest, LoginResponse} from '../models';

/**
 * Service d'authentification
 *
 * Le backend utilise l'EMAIL pour l'authentification, pas le username
 */
@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private readonly API_URL = environment.apiUrl + '/auth';
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'current_user';

  /**
   * BehaviorSubject pour observer l'utilisateur connecté
   * Permet aux composants de réagir aux changements d'authentification
   */
  private currentUserSubject = new BehaviorSubject<LoginResponse | null>(this.getCurrentUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
  }

  /**
   * POST /api/auth/login
   * Connecte un utilisateur avec EMAIL + PASSWORD
   *
   * IMPORTANT : Le backend utilise l'EMAIL pour l'authentification, pas le username
   * Le token JWT contient l'email dans son "subject"
   *
   * Flow d'authentification :
   * 1. L'utilisateur saisit email + password
   * 2. Le backend valide les credentials
   * 3. Le backend génère un token JWT (valide 24h)
   * 4. Le token et les infos utilisateur sont retournés
   * 5. Le token est sauvegardé dans localStorage
   * 6. Le JwtInterceptor ajoute automatiquement le token à chaque requête
   *
   * @param credentials - { email: string, password: string }
   * @returns Observable<LoginResponse> avec token, username, email, roles
   * @throws AuthenticationFailedException si email/password invalides
   *
   * Exemple d'utilisation :
   * ```typescript
   * this.authService.login({ email: 'user@example.com', password: 'pass123' })
   *   .subscribe({
   *     next: (response) => {
   *       console.log('Login successful:', response);
   *       this.router.navigate(['/dashboard']);
   *     },
   *     error: (error) => {
   *       console.error('Login failed:', error);
   *     }
   *   });
   * ```
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    console.log('🔵 Calling API:', `${this.API_URL}/login`);
    console.log('📤 Credentials:', {email: credentials.email, password: '***'});

    return this.http.post<LoginResponse>(`${this.API_URL}/login`, credentials)
      .pipe(
        tap(response => {
          console.log('📥 API Response:', response);

          // Le backend devrait toujours renvoyer les rôles
          // mais on garde ce fallback pour la robustesse
          if (!response.roles || response.roles.length === 0) {
            response.roles = ['ROLE_USER'];
            console.log('⚠️ No roles from API, using default: [ROLE_USER]');
          }

          // Sauvegarde le token et l'utilisateur
          this.saveToken(response.token);
          this.saveUser(response);

          // Notifie les observateurs (composants) du changement
          this.currentUserSubject.next(response);

          console.log('✅ Login successful, token saved');
        }),
      );
  }

  /**
   * Déconnecte l'utilisateur
   *
   * Actions effectuées :
   * 1. Supprime le token du localStorage
   * 2. Supprime les infos utilisateur du localStorage
   * 3. Notifie les observateurs (currentUser$ émet null)
   *
   * Note : Il n'y a pas d'appel API /logout car JWT est stateless
   * Le token sera simplement ignoré par le backend après expiration
   *
   * Exemple d'utilisation :
   * ```typescript
   * logout() {
   *   this.authService.logout();
   *   this.router.navigate(['/auth/login']);
   * }
   * ```
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    console.log('🔓 Logout successful');
  }

  /**
   * Vérifie si l'utilisateur est authentifié
   *
   * Vérifie simplement la présence d'un token dans le localStorage
   * Note : Ne valide PAS l'expiration du token (c'est fait par le backend)
   *
   * Utilisé par AuthGuard pour protéger les routes
   *
   * @returns true si un token existe, false sinon
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token;
  }

  /**
   * Récupère le token JWT du localStorage
   *
   * Le token est automatiquement ajouté aux requêtes HTTP par JwtInterceptor
   *
   * @returns Le token ou null si non connecté
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Sauvegarde le token dans le localStorage
   *
   * @param token - Le token JWT à sauvegarder
   */
  private saveToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Sauvegarde les informations utilisateur dans le localStorage
   *
   * @param user - Les infos utilisateur (username, email, roles)
   */
  private saveUser(user: LoginResponse): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * Récupère l'utilisateur courant depuis le localStorage
   *
   * @returns Les infos utilisateur ou null si non connecté
   */
  getCurrentUser(): LoginResponse | null {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  /**
   * Récupère les rôles de l'utilisateur connecté
   *
   * Utilisé par RoleGuard pour les contrôles d'accès
   *
   * Les rôles possibles :
   * - ROLE_ADMIN : Accès complet à toutes les fonctionnalités
   * - ROLE_USER : Accès aux fonctionnalités de base
   *
   * @returns Liste des rôles ou ['guest'] si non connecté
   */
  getRoles(): string[] {
    const user = this.getCurrentUser();
    return user?.roles || ['guest'];
  }

  /**
   * Vérifie si l'utilisateur a un rôle spécifique
   *
   * @param role - Le rôle à vérifier (ex: "ROLE_ADMIN")
   * @returns true si l'utilisateur a ce rôle
   *
   * Exemple d'utilisation :
   * ```typescript
   * if (this.authService.hasRole('ROLE_ADMIN')) {
   *   // Afficher le bouton "Créer un client"
   * }
   * ```
   */
  hasRole(role: string): boolean {
    return this.getRoles().includes(role);
  }

  /**
   * Vérifie si l'utilisateur est ADMIN
   *
   * @returns true si l'utilisateur a le rôle ROLE_ADMIN
   */
  isAdmin(): boolean {
    return this.hasRole('ROLE_ADMIN');
  }

  /**
   * Récupère l'email de l'utilisateur connecté
   *
   * @returns L'email ou null si non connecté
   */
  getUserEmail(): string | null {
    return this.getCurrentUser()?.email || null;
  }

  /**
   * Récupère le username de l'utilisateur connecté
   *
   * @returns Le username ou null si non connecté
   */
  getUsername(): string | null {
    return this.getCurrentUser()?.username || null;
  }

  /**
   * HELPER METHOD : Décode un token JWT sans validation
   *
   * ATTENTION : Cette méthode ne VALIDE PAS le token
   * Elle décode simplement le payload pour lire les infos
   * La validation est faite par le backend
   *
   * @param token - Le token JWT à décoder
   * @returns Le payload décodé ou null si erreur
   *
   * Exemple d'utilisation :
   * ```typescript
   * const payload = this.authService.decodeToken(token);
   * console.log('Token expires at:', new Date(payload.exp * 1000));
   * ```
   */
  decodeToken(token: string): any {
    try {
      // Un JWT est composé de 3 parties séparées par des points : header.payload.signature
      const payload = token.split('.')[1];

      // Décode le payload Base64
      const decoded = atob(payload);

      // Parse le JSON
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * HELPER METHOD : Vérifie si le token est expiré
   *
   * @param token - Le token JWT à vérifier (optionnel, utilise le token courant par défaut)
   * @returns true si le token est expiré
   *
   * Note : Le backend invalide automatiquement les tokens expirés
   * Cette méthode est utile pour l'UX (afficher "Session expirée")
   */
  isTokenExpired(token?: string): boolean {
    const tokenToCheck = token || this.getToken();

    if (!tokenToCheck) {
      return true;
    }

    const payload = this.decodeToken(tokenToCheck);

    if (!payload || !payload.exp) {
      return true;
    }

    // exp est en secondes, Date.now() est en millisecondes
    const expirationDate = new Date(payload.exp * 1000);
    const now = new Date();

    return now > expirationDate;
  }

  /**
   * HELPER METHOD : Calcule le temps restant avant expiration du token
   *
   * @returns Le nombre de millisecondes avant expiration, ou 0 si expiré
   */
  getTokenTimeRemaining(): number {
    const token = this.getToken();

    if (!token) {
      return 0;
    }

    const payload = this.decodeToken(token);

    if (!payload || !payload.exp) {
      return 0;
    }

    const expirationDate = new Date(payload.exp * 1000);
    const now = new Date();
    const remaining = expirationDate.getTime() - now.getTime();

    return remaining > 0 ? remaining : 0;
  }
}
