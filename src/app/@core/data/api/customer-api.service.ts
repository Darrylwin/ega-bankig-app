import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Customer, CustomerRequest, Page, PaginationParams } from '../models';

/**
 * Service API pour la gestion des clients
 *
 * - Il n'y a PLUS de restriction d'âge minimum pour créer un client
 * - Un client de n'importe quel âge peut être créé
 * - La restriction d'âge (18 ans) s'applique uniquement aux comptes COURANTS
 * - Les comptes ÉPARGNE n'ont aucune restriction d'âge
 *
 * Cela permet de :
 * - Créer des comptes épargne pour les mineurs (Livret Jeune, Livret A, etc.)
 * - Respecter la réalité bancaire
 */
@Injectable({
  providedIn: 'root',
})
export class CustomerApiService {

  constructor(private apiService: ApiService) {}

  /**
   * GET /api/customers (avec pagination)
   * Récupère la liste paginée des clients
   *
   * Accessible uniquement aux ADMIN
   *
   * @param params - { page, size, sort? }
   * @returns Page<Customer> contenant les clients et les infos de pagination
   *
   * Exemple de sort : "lastName,asc" ou "age,desc"
   */
  getCustomers(params: PaginationParams): Observable<Page<Customer>> {
    const queryParams: any = {
      page: params.page,
      size: params.size,
    };

    if (params.sort) {
      queryParams.sort = params.sort;
    }

    return this.apiService.get<Page<Customer>>('/customers', queryParams);
  }

  /**
   * GET /api/customers/{id}
   * Récupère un client par son ID
   *
   * Accessible aux ADMIN et USER (propriétaire uniquement)
   *
   * @param id - ID du client
   * @returns Le client avec tous ses détails
   */
  getCustomerById(id: number): Observable<Customer> {
    return this.apiService.get<Customer>(`/customers/${id}`);
  }

  /**
   * POST /api/customers
   * Crée un nouveau client
   *
   * RÈGLES DE VALIDATION :
   * 1. Email unique : Ne doit pas déjà exister dans la base
   * 2. Téléphone unique : Ne doit pas déjà exister dans la base
   * 3. Âge : AUCUNE RESTRICTION
   *    - Un enfant de 5 ans peut être créé
   *    - Un bébé de 1 an peut être créé
   *    - La restriction d'âge se fait au niveau des COMPTES, pas des CLIENTS
   *
   * Format des données :
   * - dateOfBirth : Format ISO "YYYY-MM-DD" (ex: "1990-05-15")
   * - phoneNumber : Format international "+33612345678"
   * - email : Format email valide
   * - gender : "MALE", "FEMALE", ou "OTHER"
   *
   * L'âge est calculé automatiquement par le backend à partir de dateOfBirth
   *
   * Accessible uniquement aux ADMIN
   *
   * @param customer - Les données du client (sans id, createdAt, age)
   * @returns Le client créé avec id, createdAt et age calculés
   * @throws DuplicateResourceException si email ou téléphone existe déjà
   */
  createCustomer(customer: CustomerRequest): Observable<Customer> {
    return this.apiService.post<Customer>('/customers', customer);
  }

  /**
   * PUT /api/customers/{id}
   * Met à jour un client existant
   *
   * RÈGLES DE VALIDATION :
   * 1. Si l'email change, il doit rester unique
   * 2. Si le téléphone change, il doit rester unique
   * 3. Âge : AUCUNE RESTRICTION
   *
   * Note : Vous ne pouvez pas changer l'ID ou la date de création
   *
   * Accessible uniquement aux ADMIN
   *
   * @param id - ID du client à modifier
   * @param customer - Les nouvelles données du client
   * @returns Le client mis à jour
   * @throws ResourceNotFoundException si le client n'existe pas
   * @throws DuplicateResourceException si email ou téléphone existe déjà
   */
  updateCustomer(id: number, customer: CustomerRequest): Observable<Customer> {
    return this.apiService.put<Customer>(`/customers/${id}`, customer);
  }

  /**
   * DELETE /api/customers/{id}
   * Supprime un client
   *
   * ATTENTION : La suppression est en CASCADE
   * - Tous les comptes du client seront supprimés
   * - Toutes les transactions de ces comptes seront supprimées
   *
   * Assurez-vous que le client n'a plus de solde sur ses comptes
   * avant de le supprimer (bonne pratique métier)
   *
   * Accessible uniquement aux ADMIN
   *
   * @param id - ID du client à supprimer
   * @throws ResourceNotFoundException si le client n'existe pas
   */
  deleteCustomer(id: number): Observable<void> {
    return this.apiService.delete<void>(`/customers/${id}`);
  }

  /**
   * GET /api/customers/email/{email}
   * Recherche un client par son email
   *
   * Utile pour :
   * - Vérifier si un email existe avant création
   * - Rechercher un client rapidement
   *
   * Accessible uniquement aux ADMIN
   *
   * @param email - L'email du client
   * @returns Le client correspondant
   * @throws ResourceNotFoundException si l'email n'existe pas
   */
  getCustomerByEmail(email: string): Observable<Customer> {
    return this.apiService.get<Customer>(`/customers/email/${email}`);
  }

  /**
   * HELPER METHOD : Calcule l'âge d'un client à partir de sa date de naissance
   *
   * Note : Le backend calcule déjà l'âge, mais cette méthode peut être utile
   * côté frontend pour des validations avant envoi
   *
   * @param dateOfBirth - Date de naissance au format "YYYY-MM-DD" ou Date
   * @returns L'âge en années complètes
   */
  calculateAge(dateOfBirth: string | Date): number {
    const birthDate = typeof dateOfBirth === 'string'
      ? new Date(dateOfBirth)
      : dateOfBirth;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // Ajuste si l'anniversaire n'est pas encore passé cette année
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * HELPER METHOD : Valide l'âge pour un type de compte spécifique
   *
   * RÈGLES :
   * - CURRENT (compte courant) : Nécessite 18 ans minimum
   * - SAVINGS (compte épargne) : Aucune restriction
   *
   * Cette validation peut être faite côté frontend AVANT d'appeler l'API
   * pour améliorer l'UX (afficher l'erreur immédiatement)
   *
   * @param age - L'âge du client
   * @param accountType - Le type de compte à créer ("CURRENT" ou "SAVINGS")
   * @returns Un objet { valid: boolean, message?: string }
   */
  validateAgeForAccount(age: number, accountType: 'CURRENT' | 'SAVINGS'): { valid: boolean; message?: string } {
    if (accountType === 'CURRENT' && age < 18) {
      return {
        valid: false,
        message: 'Un compte courant nécessite d\'avoir au moins 18 ans. ' +
          'Veuillez créer un compte épargne à la place.',
      };
    }

    return { valid: true };
  }

  /**
   * HELPER METHOD : Valide le format d'un numéro de téléphone
   *
   * Format attendu : +[indicatif][numéro]
   * Exemples valides : +33612345678, +22890123456
   *
   * @param phoneNumber - Le numéro à valider
   * @returns true si le format est valide
   */
  isValidPhoneFormat(phoneNumber: string): boolean {
    if (!phoneNumber) return false;
    // Format : + suivi de 1-3 chiffres (indicatif) puis 4-14 chiffres
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  /**
   * HELPER METHOD : Traduit le genre en français
   *
   * @param gender - MALE, FEMALE, ou OTHER
   * @returns Le genre en français
   */
  getGenderLabel(gender: string): string {
    const labels: Record<string, string> = {
      'MALE': 'Homme',
      'FEMALE': 'Femme',
      'OTHER': 'Autre',
    };
    return labels[gender] || gender;
  }

  /**
   * HELPER METHOD : Formate le nom complet d'un client
   *
   * @param customer - Le client
   * @returns Le nom complet formaté
   */
  getFullName(customer: Customer): string {
    return `${customer.firstName} ${customer.lastName}`;
  }

  /**
   * HELPER METHOD : Détermine si un client peut ouvrir un compte courant
   *
   * @param customer - Le client à vérifier
   * @returns true si le client a au moins 18 ans
   */
  canOpenCurrentAccount(customer: Customer): boolean {
    return customer.age >= 18;
  }

  /**
   * HELPER METHOD : Détermine si un client peut être supprimé
   *
   * Cette vérification devrait être combinée avec une vérification
   * côté backend des comptes et transactions
   *
   * @param customer - Le client à vérifier
   * @returns Un objet { canDelete: boolean, reason?: string }
   */
  canDeleteCustomer(customer: Customer): { canDelete: boolean; reason?: string } {
    // Note : Cette vérification basique devrait être complétée
    // par une vérification des comptes du client côté backend

    if (!customer) {
      return { canDelete: false, reason: 'Client invalide' };
    }

    // En production, vous devriez vérifier :
    // 1. Le client n'a pas de comptes avec solde > 0
    // 2. Le client n'a pas de transactions en attente

    return { canDelete: true };
  }
}
