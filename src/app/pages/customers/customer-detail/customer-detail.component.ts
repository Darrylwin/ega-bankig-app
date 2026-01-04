import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NbDialogService, NbToastrService } from '@nebular/theme';
import { forkJoin } from 'rxjs';
import {
  CustomerApiService,
  AccountApiService,
} from '../../../@core/data/api/index';
import { Customer, Account } from '../../../@core/data/models/index';
import { ConfirmDialogComponent } from '../../../@core/components/confirm-dialog.component';

@Component({
  selector: 'ngx-customer-detail',
  templateUrl: './customer-detail.component.html',
  styleUrls: ['./customer-detail.component.scss'],
})
export class CustomerDetailComponent implements OnInit {
  customer: Customer | null = null;
  customerAccounts: Account[] = [];
  isLoading = false;
  isLoadingAccounts = false;

  // Statistiques du client
  customerStats = {
    totalAccounts: 0,
    savingsAccounts: 0,
    currentAccounts: 0,
    totalBalance: 0,
    averageBalance: 0,
    accountAge: 0,
    activeAccounts: 0,
  };

  // Données pour les graphiques
  accountTypeChartData: any[] = [];
  balanceChartData: any[] = [];

  colorScheme = {
    domain:  ['#3366FF', '#00D68F', '#FFAA00', '#FF3D71'],
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private customerApi: CustomerApiService,
    private accountApi: AccountApiService,
    private dialogService: NbDialogService,
    private toastr: NbToastrService
  ) {}

  ngOnInit(): void {
    const customerId = +this.route.snapshot.params['id'];
    this.loadCustomerDetails(customerId);
  }

  /**
   * Charge tous les détails du client
   */
  loadCustomerDetails(customerId:  number): void {
    this.isLoading = true;

    this.customerApi.getCustomerById(customerId).subscribe({
      next: (customer) => {
        this.customer = customer;
        this.isLoading = false;
        this.loadCustomerAccounts(customerId);
      },
      error: (error) => {
        this.isLoading = false;
        this.toastr. danger('Erreur lors du chargement du client', 'Erreur');
        this.router.navigate(['/pages/customers']);
      },
    });
  }

  /**
   * Charge les comptes du client
   */
  loadCustomerAccounts(customerId: number): void {
    this.isLoadingAccounts = true;

    this.accountApi.getAccountsByCustomerId(customerId).subscribe({
      next: (accounts) => {
        this.customerAccounts = accounts;
        this.calculateStats();
        this.prepareChartData();
        this.isLoadingAccounts = false;
      },
      error:  (error) => {
        this.isLoadingAccounts = false;
        console.error('Erreur chargement comptes:', error);
      },
    });
  }

  /**
   * Calcule les statistiques du client
   */
  calculateStats(): void {
    this.customerStats.totalAccounts = this.customerAccounts.length;
    this.customerStats.savingsAccounts = this.customerAccounts.filter(
      (a) => a.accountType === 'SAVINGS'
    ).length;
    this.customerStats.currentAccounts = this.customerAccounts.filter(
      (a) => a.accountType === 'CURRENT'
    ).length;
    this.customerStats.activeAccounts = this.customerAccounts.filter(
      (a) => a.status === 'ACTIVE'
    ).length;

    this.customerStats.totalBalance = this.customerAccounts.reduce(
      (sum, a) => sum + a.balance,
      0
    );
    this.customerStats.averageBalance =
      this.customerStats.totalAccounts > 0
        ? this.customerStats.totalBalance / this.customerStats.totalAccounts
        : 0;

    if (this.customer) {
      const createdDate = new Date(this. customer.createdAt);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - createdDate.getTime());
      this.customerStats.accountAge = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
  }

  /**
   * Prépare les données pour les graphiques
   */
  prepareChartData(): void {
    // Graphique 1: Répartition par type
    this.accountTypeChartData = [
      { name: 'Épargne', value: this.customerStats.savingsAccounts },
      { name: 'Courant', value: this.customerStats.currentAccounts },
    ].filter((item) => item.value > 0);

    // Graphique 2: Répartition des soldes
    this.balanceChartData = this.customerAccounts.map((account) => ({
      name: account.accountNumber. substring(account.accountNumber.length - 8),
      value: account.balance,
    }));
  }

  /**
   * Actions
   */
  onEdit(): void {
    if (this.customer) {
      this.router.navigate(['/pages/customers/edit', this.customer. id]);
    }
  }

  onCreateAccount(): void {
    if (this.customer) {
      this.router.navigate(['/pages/accounts/new'], {
        queryParams: { customerId: this. customer.id },
      });
    }
  }

  onViewAccount(account: Account): void {
    this.router.navigate(['/pages/accounts/detail', account.id]);
  }

  onViewTransactions(): void {
    if (this.customer) {
      this.router.navigate(['/pages/transactions'], {
        queryParams: { customerId: this.customer.id },
      });
    }
  }

  onDelete(): void {
    if (!this.customer) return;

    this.dialogService
      .open(ConfirmDialogComponent, {
        context: {
          title: 'Confirmer la suppression',
          message: `Êtes-vous sûr de vouloir supprimer <strong>${this.customer.firstName} ${this.customer.lastName}</strong> ?  <br><br>
            <small class="text-warning">Le client possède ${this.customerStats.totalAccounts} compte(s).</small><br>
            <small class="text-danger">Cette action est irréversible.</small>`,
          confirmText: 'Supprimer',
          cancelText:  'Annuler',
          status: 'danger',
        },
      })
      .onClose.subscribe((confirmed) => {
        if (confirmed && this.customer) {
          this.deleteCustomer(this.customer.id);
        }
      });
  }

  deleteCustomer(id: number): void {
    this.customerApi.deleteCustomer(id).subscribe({
      next: () => {
        this.toastr.success('Client supprimé avec succès', 'Succès');
        this.router.navigate(['/pages/customers']);
      },
      error: (error) => {
        if (error.status === 409) {
          this.toastr.warning(
            'Impossible de supprimer un client avec des comptes actifs',
            'Attention'
          );
        } else {
          this.toastr.danger('Erreur lors de la suppression', 'Erreur');
        }
      },
    });
  }

  onBack(): void {
    this.router.navigate(['/pages/customers']);
  }

  /**
   * Helpers
   */
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  formatCurrency(amount: number): string {
    return new Intl. NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }

  formatAccountNumber(iban: string): string {
    return iban ?  iban.match(/.{1,4}/g)?.join(' ') || iban : '';
  }

  formatNumber(num: number): string {
    return num.toLocaleString('fr-FR');
  }

  getGenderLabel(gender: string): string {
    const labels:  any = {
      MALE: 'Homme',
      FEMALE: 'Femme',
      OTHER: 'Autre',
    };
    return labels[gender] || gender;
  }

  getGenderIcon(gender:  string): string {
    return 'person-outline';
  }

  getGenderColor(gender: string): string {
    const colors: any = {
      MALE: 'primary',
      FEMALE: 'success',
      OTHER: 'basic',
    };
    return colors[gender] || 'basic';
  }

  getAccountTypeLabel(type: string): string {
    return type === 'SAVINGS' ? 'Épargne' : 'Courant';
  }

  getAccountTypeIcon(type: string): string {
    return type === 'SAVINGS' ? 'trending-up-outline' : 'credit-card-outline';
  }

  getStatusColor(status: string): string {
    const colors: any = {
      ACTIVE: 'success',
      BLOCKED: 'danger',
      CLOSED: 'warning',
    };
    return colors[status] || 'basic';
  }

  getStatusLabel(status: string): string {
    const labels: any = {
      ACTIVE: 'Actif',
      BLOCKED: 'Bloqué',
      CLOSED: 'Clos',
    };
    return labels[status] || status;
  }
}