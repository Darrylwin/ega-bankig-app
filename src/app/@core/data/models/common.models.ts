/**
 * Réponse paginée de l'API
 * Utilisé pour /api/customers, /api/accounts, etc.
 */
export interface Page<T> {
  content: T[];              // Les données de la page
  totalElements: number;     // Nombre total d'éléments
  totalPages: number;        // Nombre total de pages
  size: number;              // Taille de la page
  number: number;            // Numéro de la page actuelle (0-based)
  first: boolean;            // Est-ce la première page ?
  last: boolean;             // Est-ce la dernière page ?
}

/**
 * Réponse d'erreur de l'API
 * Format standard retourné par le backend Spring Boot
 */
export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  validationErrors?: Record<string, string>;  // Erreurs de validation
}

/**
 * Paramètres de pagination
 * Utilisé pour envoyer les requêtes paginées
 */
export interface PaginationParams {
  page: number;              // Numéro de page (0-based)
  size: number;              // Taille de la page
  sort?: string;             // Format: "fieldName,direction" ex: "lastName,asc"
}

/**
 * Énumération des genres
 * Correspond à l'enum Gender du backend
 */
export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

/**
 * Énumération des types de compte
 * Correspond à l'enum AccountType du backend
 */
export enum AccountType {
  SAVINGS = 'SAVINGS',    // Compte épargne
  CURRENT = 'CURRENT',    // Compte courant
}

/**
 * Énumération des statuts de compte
 */
export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED',
  CLOSED = 'CLOSED',
}

/**
 * Énumération des types de transaction
 */
export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  TRANSFER = 'TRANSFER',
}

/**
 * Énumération des statuts de transaction
 */
export enum TransactionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}