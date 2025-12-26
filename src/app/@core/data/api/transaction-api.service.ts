import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  Transaction,
  DepositRequest,
  WithdrawalRequest,
  TransferRequest,
} from '../models';

/**
 * Service API pour les transactions bancaires
 * Gère dépôts, retraits, virements et historique
 */
@Injectable({
  providedIn: 'root',
})
export class TransactionApiService {

  constructor(private apiService: ApiService) {}

  /**
   * POST /api/transactions/deposit
   * Effectue un dépôt sur un compte
   */
  deposit(data: DepositRequest): Observable<Transaction> {
    return this.apiService.post<Transaction>('/transactions/deposit', data);
  }

  /**
   * POST /api/transactions/withdraw
   * Effectue un retrait sur un compte
   */
  withdraw(data: WithdrawalRequest): Observable<Transaction> {
    return this.apiService.post<Transaction>('/transactions/withdraw', data);
  }

  /**
   * POST /api/transactions/transfer
   * Effectue un virement entre deux comptes
   */
  transfer(data: TransferRequest): Observable<Transaction> {
    return this.apiService.post<Transaction>('/transactions/transfer', data);
  }

  /**
   * GET /api/transactions/account/{accountId}
   * Récupère l'historique des transactions d'un compte
   */
  getTransactionsByAccount(accountId: number): Observable<Transaction[]> {
    return this.apiService.get<Transaction[]>(`/transactions/account/${accountId}`);
  }

  /**
   * GET /api/transactions/account/{accountId}/period
   * Récupère les transactions d'un compte sur une période
   * 
   * @param accountId - ID du compte
   * @param startDate - Date de début (ISO)
   * @param endDate - Date de fin (ISO)
   */
  getTransactionsByPeriod(
    accountId: number,
    startDate: string,
    endDate: string,
  ): Observable<Transaction[]> {
    return this.apiService.get<Transaction[]>(`/transactions/account/${accountId}/period`, {
      startDate,
      endDate,
    });
  }

  /**
   * GET /api/transactions/{id}
   * Récupère les détails d'une transaction
   */
  getTransactionById(id: number): Observable<Transaction> {
    return this.apiService.get<Transaction>(`/transactions/${id}`);
  }
}