import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NbDialogService, NbToastrService } from '@nebular/theme';
import { LocalDataSource } from 'ng2-smart-table';
import { forkJoin } from 'rxjs';
import {
  AccountApiService,
  TransactionApiService,
  CustomerApiService,
} from '../../@core/data/api/index';
import {
  Account,
  Page,
  PaginationParams,
  Transaction,
} from '../../@core/data/models/index';
import { ConfirmDialogComponent } from '../../@core/components/confirm-dialog.component';

@Component({
  selector: 'ngx-accounts',
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.scss'],
})
export class AccountsComponent implements OnInit {
  // Données
  accounts: Account[] = [];
  totalItems = 0;
  pageSize = 10;
  currentPage = 0;

  // États
  isLoading = false;
  searchTerm = '';
  accountTypeFilter = 'ALL';
  statusFilter = 'ALL';

  // Vue active
  viewMode:  'table' | 'cards' | 'stats' = 'table';

  // Filtres
  filterOptions = {
    accountTypes: [
      { value: 'ALL', label: 'Tous les types' },
      { value: 'SAVINGS', label: 'Épargne' },
      { value: 'CURRENT', label: 'Courant' },
    ],
    statuses: [
      { value: 'ALL', label: 'Tous les statuts' },
      { value: 'ACTIVE', label:  'Actif' },
      { value: 'BLOCKED', label: 'Bloqué' },
      { value: 'CLOSED', label: 'Clos' },
    ],
  };

  // Statistiques globales
  globalStats = {
    totalAccounts: 0,
    totalBalance: 0,
    savingsAccounts: 0,
    currentAccounts: 0,
    activeAccounts: 0,
    blockedAccounts: 0,
    closedAccounts: 0,
    averageBalance: 0,
    totalTransactionsCount: 0,
    accountsWithPositiveBalance: 0,
    accountsWithZeroBalance: 0,
  };

  // Données pour les graphiques
  accountTypeChartData:  any[] = [];
  accountStatusChartData: any[] = [];
  balanceDistributionChartData: any[] = [];
  topAccountsChartData: any[] = [];

  colorScheme = {
    domain:  ['#3366FF', '#00D68F', '#FFAA00', '#FF3D71', '#00E096', '#A366FF'],
  };

  // Configuration du tableau
  source = new LocalDataSource();
  settings = {
    actions: {
      columnTitle: 'Actions',
      position: 'right',
      add: false,
    },
    edit: {
      editButtonContent: '<i class="nb-edit"></i>',
    },
    delete: {
      deleteButtonContent: '<i class="nb-trash"></i>',
      confirmDelete: true,
    },
    columns: {
      accountNumber: {
        title: 'N° Compte',
        type:  'string',
        filter:  true,
        valuePrepareFunction: (value:  string) => {
          return value ?  value.match(/.{1,4}/g)?.join(' ') : value;
        },
      },
      customerFullName: {
        title: 'Titulaire',
        type: 'string',
        filter: true,
      },
      accountType: {
        title: 'Type',
        type: 'html',
        filter: false,
        valuePrepareFunction: (value: string) => {
          if (value === 'SAVINGS') {
            return '<span class="badge badge-success"><i class="nb-arrow-up"></i> Épargne</span>';
          }
          return '<span class="badge badge-primary"><i class="nb-card"></i> Courant</span>';
        },
      },
      balance: {
        title: 'Solde',
        type: 'html',
        filter: false,
        valuePrepareFunction: (value: number) => {
          const formatted = new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
          }).format(value);
          const color = value > 0 ? 'success' : value < 0 ? 'danger' : 'basic';
          return `<span class="text-${color} fw-bold">${formatted}</span>`;
        },
      },
      currency: {
        title: 'Devise',
        type: 'string',
        filter: false,
      },
      status:  {
        title: 'Statut',
        type: 'html',
        filter: false,
        valuePrepareFunction: (value: string) => {
          const statusMap:  any = {
            ACTIVE: '<span class="badge badge-success"><i class="nb-checkmark-circle"></i> Actif</span>',
            BLOCKED:  '<span class="badge badge-danger"><i class="nb-close-circle"></i> Bloqué</span>',
            CLOSED: '<span class="badge badge-warning"><i class="nb-minus-circle"></i> Clos</span>',
          };
          return statusMap[value] || value;
        },
      },
      createdAt: {
        title:  'Date création',
        type: 'string',
        filter: false,
        valuePrepareFunction: (value: string) => {
          return new Date(value).toLocaleDateString('fr-FR');
        },
      },
    },
    mode: 'external',
    pager: {
      display: false,
    },
    noDataMessage: 'Aucun compte trouvé',
  };

  constructor(
    private accountApi: AccountApiService,
    private transactionApi: TransactionApiService,
    private customerApi:  CustomerApiService,
    private router: Router,
    private dialogService: NbDialogService,
    private toastr: NbToastrService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  /**
   * Charge toutes les données nécessaires
   */
  loadData(): void {
    this.isLoading = true;

    const params:  PaginationParams = {
      page: this.currentPage,
      size: this.pageSize,
      sort: 'createdAt,desc',
    };

    this.accountApi.getAccounts(params).subscribe({
      next: (response:  Page<Account>) => {
        this.accounts = response.content;
        this.totalItems = response.totalElements;
        
        this.applyFilters();
        this.calculateGlobalStats();
        this.prepareChartData();
        
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.toastr. danger('Erreur lors du chargement des comptes', 'Erreur');
        console.error(error);
      },
    });
  }

  /**
   * Calcule les statistiques globales
   */
  calculateGlobalStats(): void {
    this.globalStats.totalAccounts = this.accounts.length;
    this.globalStats.savingsAccounts = this.accounts. filter(
      (a) => a.accountType === 'SAVINGS'
    ).length;
    this.globalStats.currentAccounts = this.accounts.filter(
      (a) => a.accountType === 'CURRENT'
    ).length;
    this.globalStats.activeAccounts = this.accounts.filter(
      (a) => a.status === 'ACTIVE'
    ).length;
    this.globalStats.blockedAccounts = this.accounts.filter(
      (a) => a.status === 'BLOCKED'
    ).length;
    this.globalStats.closedAccounts = this.accounts.filter(
      (a) => a.status === 'CLOSED'
    ).length;

    this.globalStats.totalBalance = this.accounts.reduce(
      (sum, a) => sum + a.balance,
      0
    );
    this.globalStats.averageBalance =
      this.globalStats.totalAccounts > 0
        ? this.globalStats.totalBalance / this.globalStats.totalAccounts
        : 0;

    this.globalStats.accountsWithPositiveBalance = this.accounts.filter(
      (a) => a.balance > 0
    ).length;
    this.globalStats.accountsWithZeroBalance = this.accounts.filter(
      (a) => a.balance === 0
    ).length;
  }

  /**
   * Prépare les données pour les graphiques
   */
  prepareChartData(): void {
    // 1. Répartition par type
    this.accountTypeChartData = [
      {
        name: 'Comptes Épargne',
        value: this.globalStats.savingsAccounts,
      },
      {
        name:  'Comptes Courants',
        value: this.globalStats.currentAccounts,
      },
    ];

    // 2. Répartition par statut
    this.accountStatusChartData = [
      { name: 'Actifs', value: this.globalStats. activeAccounts },
      { name: 'Bloqués', value: this.globalStats.blockedAccounts },
      { name: 'Clos', value: this.globalStats.closedAccounts },
    ].filter((item) => item.value > 0);

    // 3. Distribution des soldes
    const ranges = [
      { name: '0 €', min: 0, max: 0 },
      { name: '0 - 1K €', min: 0.01, max: 1000 },
      { name: '1K - 5K €', min:  1000, max: 5000 },
      { name:  '5K - 10K €', min: 5000, max: 10000 },
      { name: '10K - 50K €', min: 10000, max: 50000 },
      { name: '50K+ €', min: 50000, max:  Infinity },
    ];

    this.balanceDistributionChartData = ranges
      .map((range) => ({
        name: range.name,
        value: this.accounts.filter(
          (a) => a.balance >= range.min && a.balance < range.max
        ).length,
      }))
      .filter((item) => item.value > 0);

    // 4. Top 10 comptes avec le plus de solde
    this.topAccountsChartData = this.accounts
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 10)
      .map((account) => ({
        name: account.customerFullName. substring(0, 20),
        value: account.balance,
      }));
  }

  /**
   * Applique les filtres
   */
  applyFilters(): void {
    let filtered = [... this.accounts];

    if (this.accountTypeFilter !== 'ALL') {
      filtered = filtered.filter(
        (account) => account.accountType === this.accountTypeFilter
      );
    }

    if (this.statusFilter !== 'ALL') {
      filtered = filtered.filter(
        (account) => account.status === this. statusFilter
      );
    }

    if (this.searchTerm. trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (account) =>
          account.accountNumber.toLowerCase().includes(term) ||
          account.customerFullName.toLowerCase().includes(term)
      );
    }

    this.source.load(filtered);
  }

  /**
   * Réinitialise les filtres
   */
  resetFilters(): void {
    this.searchTerm = '';
    this. accountTypeFilter = 'ALL';
    this.statusFilter = 'ALL';
    this.applyFilters();
  }

  /**
   * Change le mode d'affichage
   */
  setViewMode(mode: 'table' | 'cards' | 'stats'): void {
    this.viewMode = mode;
  }

  /**
   * Navigation vers la création
   */
  onCreate(): void {
    this.router.navigate(['/pages/accounts/new']);
  }

  /**
   * Navigation vers les détails
   */
  onView(event: any): void {
    const account = event.data as Account;
    this.router. navigate(['/pages/accounts/detail', account.id]);
  }

  /**
   * Suppression d'un compte
   */
  onDelete(event: any): void {
    const account = event.data as Account;

    this.dialogService
      .open(ConfirmDialogComponent, {
        context: {
          title: 'Confirmer la suppression',
          message: `Êtes-vous sûr de vouloir supprimer le compte <strong>${this.formatAccountNumber(
            account.accountNumber
          )}</strong> ? <br><br><small class="text-muted">Client: ${
            account.customerFullName
          }<br>Solde: ${this.formatCurrency(account.balance)}</small>`,
          confirmText: 'Supprimer',
          cancelText: 'Annuler',
          status: 'danger',
        },
      })
      .onClose.subscribe((confirmed) => {
        if (confirmed) {
          this.deleteAccount(account. id);
        }
      });
  }

  /**
   * Supprime un compte
   */
  private deleteAccount(id: number): void {
    this.accountApi.deleteAccount(id).subscribe({
      next: () => {
        this.toastr. success('Compte supprimé avec succès', 'Succès');
        this.loadData();
      },
      error: (error) => {
        if (error.status === 409) {
          this.toastr.warning(
            'Impossible de supprimer un compte avec un solde non nul',
            'Attention'
          );
        } else if (error.status === 400) {
          this.toastr.warning(
            'Impossible de supprimer un compte avec des transactions',
            'Attention'
          );
        } else {
          this.toastr.danger('Erreur lors de la suppression', 'Erreur');
        }
      },
    });
  }

  /**
   * Export CSV
   */
  exportToCSV(): void {
    const headers = [
      'N° Compte',
      'Titulaire',
      'Type',
      'Solde',
      'Devise',
      'Statut',
      'Date création',
    ];
    const rows = this.accounts.map((a) => [
      a.accountNumber,
      a.customerFullName,
      a.accountType === 'SAVINGS' ? 'Épargne' : 'Courant',
      a.balance. toString(),
      a.currency,
      a.status === 'ACTIVE'
        ? 'Actif'
        : a.status === 'BLOCKED'
        ?  'Bloqué'
        : 'Clos',
      new Date(a.createdAt).toLocaleDateString('fr-FR'),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `comptes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    this.toastr.success('Export CSV réussi', 'Succès');
  }

  /**
   * Pagination
   */
  goToFirstPage(): void {
    this.currentPage = 0;
    this.loadData();
  }

  goToPreviousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadData();
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadData();
    }
  }

  goToLastPage(): void {
    this.currentPage = this.totalPages - 1;
    this. loadData();
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  get currentPageDisplay(): number {
    return this. currentPage + 1;
  }

  /**
   * Helpers de formatage
   */
  formatAccountNumber(iban: string): string {
    return iban ?  iban.match(/.{1,4}/g)?.join(' ') || iban : '';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }

  formatNumber(num: number): string {
    return num.toLocaleString('fr-FR');
  }

  calculatePercentage(part: number, total: number): number {
    return total > 0 ? Math.round((part / total) * 100) : 0;
  }
}