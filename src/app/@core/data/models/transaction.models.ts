import { TransactionType, TransactionStatus } from './common.models';

/**
 * Transaction bancaire
 */
export interface Transaction {
  id: number;
  transactionType: TransactionType;
  amount: number;
  transactionDate: string;
  description?: string;
  sourceAccountNumber: string;
  destinationAccountNumber?: string;
  transactionReference: string;
  status: TransactionStatus;
  balanceBefore: number;
  balanceAfter: number;
}

/**
 * Requête de dépôt
 */
export interface DepositRequest {
  accountId: number;
  amount: number;
  description?: string;
}

/**
 * Requête de retrait
 */
export interface WithdrawalRequest {
  accountId: number;
  amount: number;
  description?: string;
}

/**
 * Requête de virement
 */
export interface TransferRequest {
  sourceAccountId: number;
  destinationAccountId: number;
  amount: number;
  description?: string;
}