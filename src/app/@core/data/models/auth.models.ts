/**
 * Requête de connexion
 * Envoyé à POST /api/auth/login
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Requête d'inscription
 * Envoyé à POST /api/auth/register
 */
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

/**
 * Réponse d'authentification
 * Reçu après login ou register
 */
export interface AuthResponse {
  token: string;              // Token JWT
  type: string;               // "Bearer"
  id: number;
  username: string;
  email: string;
  roles: string[];            // ["ROLE_ADMIN", "ROLE_USER"]
}

/**
 * Profil utilisateur
 * Reçu de GET /api/auth/me
 */
export interface UserProfile {
  id: number;
  username: string;
  email: string;
  enabled: boolean;
  createdAt: string;
  roles: string[];
  customerId?: number;        // Optionnel (? signifie nullable)
}

/**
 * Requête de changement de mot de passe
 * Envoyé à PUT /api/auth/change-password
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Requête de création d'admin
 * Envoyé à POST /api/auth/admin/create
 */
export interface CreateAdminRequest {
  username: string;
  email: string;
  password: string;
}