/**
 * Statistiques du dashboard
 */
export interface DashboardStats {
  // Statistiques générales
  totalCustomers: number;
  totalAccounts: number;
  totalTransactions: number;
  totalBalance: number;

  // Par type de compte
  savingsAccountsCount: number;
  currentAccountsCount: number;

  // Statistiques du jour
  transactionsToday: number;
  depositsToday: number;
  withdrawalsToday: number;

  // Statistiques de la semaine
  transactionsThisWeek: number;
  depositsThisWeek: number;
  withdrawalsThisWeek: number;

  // Statistiques du mois
  transactionsThisMonth: number;
  depositsThisMonth: number;
  withdrawalsThisMonth: number;
}