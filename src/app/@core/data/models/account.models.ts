import { AccountType, AccountStatus } from './common.models';

/**
 * Compte bancaire (Account)
 */
export interface Account {
  id: number;
  accountNumber: string;        // IBAN
  accountType: AccountType;
  createdAt: string;
  balance: number;
  currency: string;
  status: AccountStatus;
  customerId: number;
  customerFullName: string;
}

/**
 * Requête de création de compte
 */
export interface AccountRequest {
  customerId: number;
  accountType: AccountType;
  currency: string;
}