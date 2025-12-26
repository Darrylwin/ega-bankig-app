import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Account, AccountRequest, Page, PaginationParams } from '../models';

/**
 * Service API pour la gestion des comptes bancaires
 */
@Injectable({
  providedIn: 'root',
})
export class AccountApiService {

  constructor(private apiService: ApiService) {}

  /**
   * GET /api/accounts (avec pagination)
   * Récupère la liste paginée des comptes
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
   */
  getAccountById(id: number): Observable<Account> {
    return this.apiService.get<Account>(`/accounts/${id}`);
  }

  /**
   * POST /api/accounts
   * Crée un nouveau compte
   */
  createAccount(account: AccountRequest): Observable<Account> {
    return this.apiService.post<Account>('/accounts', account);
  }

  /**
   * DELETE /api/accounts/{id}
   * Supprime un compte
   */
  deleteAccount(id: number): Observable<void> {
    return this.apiService.delete<void>(`/accounts/${id}`);
  }

  /**
   * GET /api/accounts/number/{accountNumber}
   * Recherche un compte par son numéro IBAN
   */
  getAccountByNumber(accountNumber: string): Observable<Account> {
    return this.apiService.get<Account>(`/accounts/number/${accountNumber}`);
  }

  /**
   * GET /api/accounts/customer/{customerId}
   * Récupère tous les comptes d'un client
   */
  getAccountsByCustomerId(customerId: number): Observable<Account[]> {
    return this.apiService.get<Account[]>(`/accounts/customer/${customerId}`);
  }

  /**
   * GET /api/accounts/{accountId}/statement
   * Génère et télécharge un relevé bancaire PDF
   * 
   * @param accountId - ID du compte
   * @param startDate - Date de début (format ISO: 2026-01-01T00:00:00)
   * @param endDate - Date de fin
   * @returns Un Blob (fichier PDF)
   */
  generateStatement(accountId: number, startDate: string, endDate: string): Observable<Blob> {
    return this.apiService.getBlob(`/accounts/${accountId}/statement`, {
      startDate,
      endDate,
    });
  }
}