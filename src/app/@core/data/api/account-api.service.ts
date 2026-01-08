import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Account, AccountRequest, Page, PaginationParams } from '../models';

/**
 * Service API pour la gestion des comptes bancaires
 *
 * concernant l'âge minimum selon le type de compte
 */
@Injectable({
  providedIn: 'root',
})
export class AccountApiService {

  constructor(private apiService: ApiService) {}

  /**
   * GET /api/accounts (avec pagination)
   * Récupère la liste paginée des comptes
   *
   * Accessible uniquement aux ADMIN
   *
   * @param params - { page, size, sort? }
   * @returns Page<Account> contenant les comptes et les infos de pagination
   */
  getAccounts(params: PaginationParams): Observable<Page<Account>> {
    const queryParams: any = {
      page: params.page,
      size: params.size,
    };

    if (params.sort) {
      queryParams.sort = params.sort;
    }

    return this.apiService.get<Page<Account>>('/accounts', queryParams);
  }

  /**
   * GET /api/accounts/{id}
   * Récupère un compte par son ID
   *
   * Accessible aux ADMIN et USER (propriétaire du compte)
   *
   * @param id - ID du compte
   * @returns Le compte avec tous ses détails
   */
  getAccountById(id: number): Observable<Account> {
    return this.apiService.get<Account>(`/accounts/${id}`);
  }

  /**
   * POST /api/accounts
   * Crée un nouveau compte bancaire
   *
   * RÈGLES MÉTIER IMPORTANTES :
   * - CURRENT (compte courant) : Le client doit avoir au moins 18 ans
   * - SAVINGS (compte épargne) : Aucune restriction d'âge
   *
   * Le backend validera automatiquement l'âge du client.
   * Si le client a moins de 18 ans et que vous tentez de créer un compte CURRENT,
   * vous recevrez une erreur 400 avec le message :
   * "A current account requires the customer to be at least 18 years old.
   *  Customers under 18 can only open savings accounts."
   *
   * Le compte est créé avec :
   * - Un numéro IBAN unique généré automatiquement
   * - Un solde initial de 0.00
   * - Le statut ACTIVE
   *
   * Accessible uniquement aux ADMIN
   *
   * @param account - { customerId, accountType, currency }
   * @returns Le compte créé avec son IBAN
   * @throws InvalidOperationException si âge < 18 ans pour CURRENT
   */
  createAccount(account: AccountRequest): Observable<Account> {
    return this.apiService.post<Account>('/accounts', account);
  }

  /**
   * DELETE /api/accounts/{id}
   * Supprime un compte
   *
   * ATTENTION : La suppression est en CASCADE
   * - Toutes les transactions du compte seront également supprimées
   *
   * Accessible uniquement aux ADMIN
   *
   * @param id - ID du compte à supprimer
   */
  deleteAccount(id: number): Observable<void> {
    return this.apiService.delete<void>(`/accounts/${id}`);
  }

  /**
   * GET /api/accounts/number/{accountNumber}
   * Recherche un compte par son numéro IBAN
   *
   * Utile pour :
   * - Valider un IBAN avant un virement
   * - Rechercher un compte par son numéro
   *
   * Accessible aux ADMIN et USER
   *
   * @param accountNumber - Le numéro IBAN complet (ex: "FR7612345678901234567890123")
   * @returns Le compte correspondant
   * @throws ResourceNotFoundException si l'IBAN n'existe pas
   */
  getAccountByNumber(accountNumber: string): Observable<Account> {
    return this.apiService.get<Account>(`/accounts/number/${accountNumber}`);
  }

  /**
   * GET /api/accounts/customer/{customerId}
   * Récupère tous les comptes d'un client
   *
   * Un client peut avoir plusieurs comptes (épargne et/ou courant)
   *
   * Accessible aux ADMIN et USER (propriétaire)
   *
   * @param customerId - ID du client
   * @returns Liste de tous les comptes du client
   */
  getAccountsByCustomerId(customerId: number): Observable<Account[]> {
    return this.apiService.get<Account[]>(`/accounts/customer/${customerId}`);
  }

  /**
   * GET /api/accounts/{accountId}/statement
   * Génère et télécharge un relevé bancaire au format PDF
   *
   * Le relevé contient :
   * - Informations du compte et du client
   * - TOUTES les transactions de la période (virements reçus inclus)
   * - Résumé : nombre de transactions, totaux des dépôts/retraits/virements
   * - Solde actuel du compte
   *
   * Le PDF est généré dynamiquement par le backend avec iText7
   *
   * Format des dates : ISO 8601 avec heure
   * Exemple : "2026-01-01T00:00:00" pour le 1er janvier 2026 à minuit
   *
   * Accessible aux ADMIN et USER (propriétaire du compte)
   *
   * @param accountId - ID du compte
   * @param startDate - Date de début (format ISO: "YYYY-MM-DDTHH:mm:ss")
   * @param endDate - Date de fin (format ISO: "YYYY-MM-DDTHH:mm:ss")
   * @returns Un Blob (fichier PDF) à télécharger
   *
   * Exemple d'utilisation dans un composant :
   * ```typescript
   * this.accountService.generateStatement(accountId, startDate, endDate)
   *   .subscribe(blob => {
   *     const url = window.URL.createObjectURL(blob);
   *     const link = document.createElement('a');
   *     link.href = url;
   *     link.download = `releve_${accountId}_${Date.now()}.pdf`;
   *     link.click();
   *     window.URL.revokeObjectURL(url);
   *   });
   * ```
   */
  generateStatement(accountId: number, startDate: string, endDate: string): Observable<Blob> {
    return this.apiService.getBlob(`/accounts/${accountId}/statement`, {
      startDate,
      endDate,
    });
  }

  /**
   * HELPER METHOD : Formate un numéro IBAN pour l'affichage
   *
   * Transforme : "FR7612345678901234567890123"
   * En : "FR76 1234 5678 9012 3456 7890 123"
   *
   * @param iban - Le numéro IBAN brut
   * @returns Le numéro IBAN formaté avec des espaces
   *
   * Exemple d'utilisation :
   * ```typescript
   * const formatted = this.accountService.formatIban(account.accountNumber);
   * ```
   */
  formatIban(iban: string): string {
    if (!iban) return '';
    // Groupe par 4 caractères avec un espace
    return iban.replace(/(.{4})/g, '$1 ').trim();
  }

  /**
   * HELPER METHOD : Valide le format d'un IBAN
   *
   * Vérifie que l'IBAN respecte le format de base (2 lettres + chiffres)
   * Note : Cette validation est basique, pour une validation complète,
   * utilisez une librairie comme iban.js
   *
   * @param iban - Le numéro IBAN à valider
   * @returns true si le format est valide, false sinon
   */
  isValidIbanFormat(iban: string): boolean {
    if (!iban) return false;
    // Format de base : 2 lettres (pays) + 2 chiffres (clé) + alphanumériques
    const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/;
    return ibanRegex.test(iban.replace(/\s/g, ''));
  }

  /**
   * HELPER METHOD : Détermine si un compte peut être supprimé
   *
   * Un compte ne devrait être supprimé que si :
   * - Son solde est à 0
   * - Il n'a pas de transactions en attente
   *
   * Note : Cette vérification devrait idéalement être faite côté backend aussi
   *
   * @param account - Le compte à vérifier
   * @returns true si le compte peut être supprimé
   */
  canDeleteAccount(account: Account): boolean {
    return account.balance === 0 && account.status !== 'BLOCKED';
  }

  /**
   * HELPER METHOD : Traduit le type de compte en français
   *
   * @param accountType - SAVINGS ou CURRENT
   * @returns Le type de compte en français
   */
  getAccountTypeLabel(accountType: string): string {
    const labels: Record<string, string> = {
      'SAVINGS': 'Compte Épargne',
      'CURRENT': 'Compte Courant',
    };
    return labels[accountType] || accountType;
  }

  /**
   * HELPER METHOD : Traduit le statut de compte en français
   *
   * @param status - ACTIVE, BLOCKED, ou CLOSED
   * @returns Le statut en français
   */
  getAccountStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'ACTIVE': 'Actif',
      'BLOCKED': 'Bloqué',
      'CLOSED': 'Fermé',
    };
    return labels[status] || status;
  }
}
