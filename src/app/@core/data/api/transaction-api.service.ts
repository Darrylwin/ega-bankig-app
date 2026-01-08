import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {ApiService} from './api.service';
import {
  Transaction,
  DepositRequest,
  WithdrawalRequest,
  TransferRequest,
} from '../models';

/**
 * Service API pour les transactions bancaires
 *
 * 1. Les requêtes utilisent maintenant les endpoints corrigés du backend
 * 2. getTransactionsByAccount utilise la requête qui inclut les virements reçus
 * 3. Documentation mise à jour pour refléter le comportement réel
 */
@Injectable({
  providedIn: 'root',
})
export class TransactionApiService {

  constructor(private apiService: ApiService) {
  }

  /**
   * POST /api/transactions/deposit
   * Effectue un dépôt sur un compte
   *
   * Le compte verra son solde augmenté du montant déposé
   *
   * @param data - { accountId, amount, description? }
   * @returns La transaction créée avec status SUCCESS
   */
  deposit(data: DepositRequest): Observable<Transaction> {
    return this.apiService.post<Transaction>('/transactions/deposit', data);
  }

  /**
   * POST /api/transactions/withdraw
   * Effectue un retrait sur un compte
   *
   * Conditions :
   * - Le compte doit être ACTIVE
   * - Le solde doit être >= montant
   *
   * @param data - { accountId, amount, description? }
   * @returns La transaction créée avec status SUCCESS
   * @throws InsufficientBalanceException si le solde est insuffisant
   */
  withdraw(data: WithdrawalRequest): Observable<Transaction> {
    return this.apiService.post<Transaction>('/transactions/withdraw', data);
  }

  /**
   * POST /api/transactions/transfer
   * Effectue un virement entre deux comptes
   *
   * COMPORTEMENT IMPORTANT :
   * - Le backend crée DEUX transactions :
   *   1. Transaction de DÉBIT sur le compte source
   *   2. Transaction de CRÉDIT sur le compte destination
   * - Les deux comptes verront le virement dans leur historique
   * - L'API retourne la transaction du compte source
   * - Les deux transactions partagent la même référence (avec suffixe -IN pour la destination)
   *
   * Conditions :
   * - Les deux comptes doivent être ACTIVE
   * - Les comptes doivent être différents
   * - Le compte source doit avoir un solde >= montant
   *
   * @param data - { sourceAccountId, destinationAccountId, amount, description? }
   * @returns La transaction de débit du compte source
   */
  transfer(data: TransferRequest): Observable<Transaction> {
    return this.apiService.post<Transaction>('/transactions/transfer', data);
  }

  /**
   * GET /api/transactions/account/{accountId}
   * Récupère l'historique COMPLET des transactions d'un compte
   *
   * Cette requête utilise maintenant la query corrigée du backend qui inclut :
   * - Les dépôts sur ce compte
   * - Les retraits de ce compte
   * - Les virements ENVOYÉS depuis ce compte (account = ce compte)
   * - Les virements REÇUS sur ce compte (destinationAccount = ce compte)
   *
   * Les transactions sont triées par date décroissante (plus récentes en premier)
   *
   * @param accountId - ID du compte
   * @returns Liste complète des transactions (virements reçus inclus)
   */
  getTransactionsByAccount(accountId: number): Observable<Transaction[]> {
    return this.apiService.get<Transaction[]>(`/transactions/account/${accountId}`);
  }

  /**
   * GET /api/transactions/account/{accountId}/period
   * Récupère les transactions d'un compte sur une période donnée
   *
   * Cette requête inclut maintenant TOUS les types de transactions, y compris les virements reçus
   *
   * Utilisé principalement pour :
   * - Générer des relevés bancaires
   * - Afficher l'historique filtré par dates
   * - Calculer des statistiques sur une période
   *
   * @param accountId - ID du compte
   * @param startDate - Date de début au format ISO (ex: "2026-01-01T00:00:00")
   * @param endDate - Date de fin au format ISO (ex: "2026-12-31T23:59:59")
   * @returns Liste des transactions dans la période (virements reçus inclus)
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
   * Récupère les détails d'une transaction spécifique
   *
   * @param id - ID de la transaction
   * @returns La transaction avec tous ses détails
   */
  getTransactionById(id: number): Observable<Transaction> {
    return this.apiService.get<Transaction>(`/transactions/${id}`);
  }

  /**
   * HELPER METHODS (à utiliser côté composant)
   * Ces méthodes aident à traiter les transactions pour l'affichage
   */

  /**
   * Détermine si une transaction est un virement reçu
   * Compare le accountNumber avec le compte actuel
   *
   * @param transaction - La transaction à vérifier
   * @param currentAccountNumber - Le numéro IBAN du compte courant
   * @returns true si c'est un virement reçu, false sinon
   */
  isIncomingTransfer(transaction: Transaction, currentAccountNumber: string): boolean {
    // Pour un virement, si le compte principal (sourceAccountNumber)
    // n'est PAS notre compte, c'est qu'on est le destinataire
    return transaction.transactionType === 'TRANSFER' &&
      transaction.sourceAccountNumber !== currentAccountNumber;
  }

  /**
   * Formate le montant d'une transaction avec le bon signe
   *
   * @param transaction - La transaction
   * @param currentAccountNumber - Le numéro IBAN du compte courant
   * @returns Le montant formaté avec signe (ex: "+1000.00" ou "-500.00")
   */
  getDisplayAmount(transaction: Transaction, currentAccountNumber: string): string {
    const isIncoming = this.isIncomingTransfer(transaction, currentAccountNumber);
    const isCredit = transaction.transactionType === 'DEPOSIT' || isIncoming;
    const sign = isCredit ? '+' : '-';
    return `${sign}${transaction.amount.toFixed(2)}`;
  }

  /**
   * Récupère le bon solde à afficher selon le type de transaction
   *
   * @param transaction - La transaction
   * @param currentAccountNumber - Le numéro IBAN du compte courant
   * @param before - true pour le solde avant, false pour le solde après
   * @returns Le solde approprié
   */
  getDisplayBalance(transaction: Transaction, currentAccountNumber: string, before: boolean = false): number {
    const isIncoming = this.isIncomingTransfer(transaction, currentAccountNumber);

    if (isIncoming) {
      // Pour un virement reçu, utiliser les champs destination
      return before ? (transaction.destinationBalanceBefore || 0) : (transaction.destinationBalanceAfter || 0);
    } else {
      // Pour toutes les autres transactions, utiliser les champs normaux
      return before ? transaction.balanceBefore : transaction.balanceAfter;
    }
  }
}
