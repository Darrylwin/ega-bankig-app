import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NbDialogService, NbToastrService } from '@nebular/theme';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  AccountApiService,
  TransactionApiService,
  CustomerApiService,
} from '../../../@core/data/api/index';
import { Account, Transaction, Customer } from '../../../@core/data/models/index';
import { ConfirmDialogComponent } from '../../../@core/components/confirm-dialog.component';

@Component({
  selector: 'ngx-account-detail',
  templateUrl:  './account-detail.component.html',
  styleUrls: ['./account-detail.component.scss'],
})
export class AccountDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  account: Account | null = null;
  customer: Customer | null = null;
  recentTransactions: Transaction[] = [];
  isLoading = false;
  isLoadingTransactions = false;

  // Statistiques du compte
  accountStats = {
    totalTransactions: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalTransfers: 0,
    depositAmount: 0,
    withdrawalAmount: 0,
    transferAmount: 0,
    averageTransaction: 0,
    lastTransactionDate: null as string | null,
    accountAge: 0,
    monthlyAverage: 0,
  };

  constructor(
    private route: ActivatedRoute,
    private router:  Router,
    private accountApi:  AccountApiService,
    private transactionApi: TransactionApiService,
    private customerApi: CustomerApiService,
    private dialogService:  NbDialogService,
    private toastr: NbToastrService
  ) {}

  ngOnInit(): void {
    const accountId = +this. route.snapshot.params['id'];
    if (accountId) {
      this.loadAccountDetails(accountId);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charge tous les détails du compte
   */
  loadAccountDetails(accountId: number): void {
    this.isLoading = true;

    this.accountApi
      .getAccountById(accountId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (account) => {
          this.account = account;
          this.loadCustomer(account. customerId);
          this.loadRecentTransactions(accountId);
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          this.toastr. danger('Erreur lors du chargement du compte', 'Erreur');
          this.router.navigate(['/pages/accounts']);
        },
      });
  }

  /**
   * Charge les informations du client
   */
  loadCustomer(customerId: number): void {
    this.customerApi
      .getCustomerById(customerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (customer) => {
          this.customer = customer;
        },
        error: (error) => {
          console.error('Erreur chargement client:', error);
        },
      });
  }

  /**
   * Charge les dernières transactions
   */
  loadRecentTransactions(accountId: number): void {
    this.isLoadingTransactions = true;

    this.transactionApi
      . getTransactionsByAccount(accountId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (transactions) => {
          this.recentTransactions = transactions.slice(0, 10);
          this.calculateAccountStats(transactions);
          this.isLoadingTransactions = false;
        },
        error: (error) => {
          this.isLoadingTransactions = false;
          console.error('Erreur chargement transactions:', error);
        },
      });
  }

  /**
   * Calcule les statistiques du compte
   */
  calculateAccountStats(transactions: Transaction[]): void {
    this.accountStats.totalTransactions = transactions.length;

    const deposits = transactions.filter((t) => t.transactionType === 'DEPOSIT');
    const withdrawals = transactions.filter((t) => t.transactionType === 'WITHDRAWAL');
    const transfers = transactions.filter((t) => t.transactionType === 'TRANSFER');

    this.accountStats.totalDeposits = deposits.length;
    this.accountStats.totalWithdrawals = withdrawals.length;
    this.accountStats.totalTransfers = transfers.length;

    this.accountStats.depositAmount = deposits.reduce((sum, t) => sum + t.amount, 0);
    this.accountStats.withdrawalAmount = withdrawals.reduce((sum, t) => sum + t.amount, 0);
    this.accountStats.transferAmount = transfers. reduce((sum, t) => sum + t.amount, 0);

    this.accountStats.averageTransaction =
      transactions.length > 0 ? transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / transactions.length : 0;

    if (transactions.length > 0) {
      const sorted = [...transactions].sort(
        (a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
      );
      this.accountStats.lastTransactionDate = sorted[0].transactionDate;
    }

    if (this.account) {
      const createdDate = new Date(this. account.createdAt);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - createdDate.getTime());
      this.accountStats.accountAge = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const months = this.accountStats.accountAge / 30;
      this.accountStats.monthlyAverage = months > 0 ? transactions. length / months : 0;
    }
  }

  /**
   * Actions rapides
   */
  onDeposit(): void {
    this.router.navigate(['/pages/transactions/deposit'], {
      queryParams: { accountId: this.account?.id },
    });
  }

  onWithdraw(): void {
    this.router.navigate(['/pages/transactions/withdraw'], {
      queryParams: { accountId: this.account?.id },
    });
  }

  onTransfer(): void {
    this.router.navigate(['/pages/transactions/transfer'], {
      queryParams:  { sourceAccountId: this.account?.id },
    });
  }

  onViewAllTransactions(): void {
    if (this.account) {
      this.router. navigate(['/pages/transactions/history', this.account.id]);
    }
  }

  onGenerateStatement(): void {
    if (this.account) {
      this.router.navigate(['/pages/accounts/statement', this.account.id]);
    }
  }

  onViewCustomer(): void {
    if (this. customer) {
      this.router.navigate(['/pages/customers/detail', this.customer.id]);
    }
  }

  onDeleteAccount(): void {
    if (!this.account) return;

    this.dialogService
      .open(ConfirmDialogComponent, {
        context: {
          title: 'Confirmer la suppression',
          message: `Êtes-vous sûr de vouloir supprimer ce compte ? <br><br>
            <strong>Numéro: </strong> ${this.formatAccountNumber(this.account.accountNumber)}<br>
            <strong>Solde:</strong> ${this.formatCurrency(this.account.balance)}<br><br>
            <small class="text-danger">Cette action est irréversible. </small>`,
          confirmText: 'Supprimer',
          cancelText: 'Annuler',
          status: 'danger',
        },
      })
      .onClose.pipe(takeUntil(this.destroy$))
      .subscribe((confirmed) => {
        if (confirmed && this.account) {
          this.deleteAccount(this.account. id);
        }
      });
  }

  deleteAccount(id: number): void {
    this.accountApi
      .deleteAccount(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastr.success('Compte supprimé avec succès', 'Succès');
          this.router.navigate(['/pages/accounts']);
        },
        error: (error) => {
          if (error.status === 409) {
            this.toastr. warning('Impossible de supprimer un compte avec un solde non nul', 'Attention');
          } else if (error.status === 400) {
            this.toastr.warning('Impossible de supprimer un compte avec des transactions', 'Attention');
          } else {
            this.toastr.danger('Erreur lors de la suppression', 'Erreur');
          }
        },
      });
  }

  onBack(): void {
    this.router.navigate(['/pages/accounts']);
  }

  /**
   * Helpers
   */
  formatAccountNumber(iban: string): string {
    return iban ? iban. match(/.{1,4}/g)?.join(' ') || iban : '';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0) + ' CFA';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  formatDateTime(date:  string): string {
    return new Date(date).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatNumber(num: number): string {
    return num?. toLocaleString('fr-FR') || '0';
  }

  getAccountTypeLabel(type:  string): string {
    return type === 'SAVINGS' ? 'Compte Épargne' : 'Compte Courant';
  }

  getAccountTypeIcon(type: string): string {
    return type === 'SAVINGS' ? 'trending-up-outline' : 'credit-card-outline';
  }

  getStatusLabel(status:  string): string {
    const labels: any = {
      ACTIVE: 'Actif',
      BLOCKED: 'Bloqué',
      CLOSED:  'Clos',
    };
    return labels[status] || status;
  }

  getStatusColor(status: string): string {
    const colors: any = {
      ACTIVE: 'success',
      BLOCKED:  'danger',
      CLOSED: 'warning',
    };
    return colors[status] || 'basic';
  }

  getTransactionTypeLabel(type: string): string {
    const labels: any = {
      DEPOSIT: 'Dépôt',
      WITHDRAWAL: 'Retrait',
      TRANSFER: 'Virement',
    };
    return labels[type] || type;
  }

  getTransactionTypeIcon(type: string): string {
    const icons: any = {
      DEPOSIT: 'arrow-downward-outline',
      WITHDRAWAL: 'arrow-upward-outline',
      TRANSFER: 'swap-outline',
    };
    return icons[type] || 'activity-outline';
  }

  getTransactionTypeColor(type: string): string {
    const colors: any = {
      DEPOSIT: 'success',
      WITHDRAWAL: 'danger',
      TRANSFER: 'primary',
    };
    return colors[type] || 'basic';
  }
}