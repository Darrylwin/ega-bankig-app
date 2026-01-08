import { TransactionType, TransactionStatus } from './common.models';

/**
 * Transaction bancaire
 *
 * - sourceAccountNumber renommé en accountNumber (correspond au champ "account" du backend)
 * - Ajout de destinationBalanceBefore et destinationBalanceAfter pour les virements
 *
 * Note : Pour les virements, vous recevrez DEUX transactions :
 * - Transaction 1 : account = compte source, destinationAccount = compte destination
 * - Transaction 2 : account = compte destination, destinationAccount = compte source
 * Cela permet aux deux comptes de voir le virement dans leur historique
 */
export interface Transaction {
  id: number;
  transactionType: TransactionType;
  amount: number;
  transactionDate: string;
  description?: string;

  /**
   * C'est le compte principal concerné par la transaction :
   * - DEPOSIT : compte qui reçoit
   * - WITHDRAWAL : compte qui perd
   * - TRANSFER : compte débité (pour la transaction 1) ou crédité (pour la transaction 2)
   */
  sourceAccountNumber: string;  // Gardé pour compatibilité, mais correspond à "account" backend

  /**
   * Compte destination (uniquement pour les virements)
   */
  destinationAccountNumber?: string;

  transactionReference: string;
  status: TransactionStatus;

  /**
   * Solde du compte principal AVANT la transaction
   */
  balanceBefore: number;

  /**
   * Solde du compte principal APRÈS la transaction
   */
  balanceAfter: number;

  /**
   * NOUVEAUX CHAMPS : Pour les virements uniquement
   * Solde du compte destination avant/après le virement
   */
  destinationBalanceBefore?: number;
  destinationBalanceAfter?: number;
}

/**
 * Requête de dépôt
 * POST /api/transactions/deposit
 */
export interface DepositRequest {
  accountId: number;
  amount: number;
  description?: string;
}

/**
 * Requête de retrait
 * POST /api/transactions/withdraw
 */
export interface WithdrawalRequest {
  accountId: number;
  amount: number;
  description?: string;
}

/**
 * Requête de virement
 * POST /api/transactions/transfer
 *
 * IMPORTANT : Cette requête créera DEUX transactions dans le backend :
 * 1. Transaction de débit pour le compte source
 * 2. Transaction de crédit pour le compte destination
 *
 * L'API retourne la transaction du compte source, mais les deux sont créées
 */
export interface TransferRequest {
  sourceAccountId: number;
  destinationAccountId: number;
  amount: number;
  description?: string;
}

/**
 * Helper type pour différencier les transactions dans l'UI
 * Utile pour afficher correctement les virements reçus vs envoyés
 */
export interface TransactionDisplay extends Transaction {
  /**
   * Indique si c'est un virement reçu (true) ou envoyé (false)
   * Calculé côté frontend en comparant l'accountNumber avec le compte courant
   */
  isIncoming?: boolean;

  /**
   * Montant formaté avec signe (+ pour crédit, - pour débit)
   */
  displayAmount?: string;
}
