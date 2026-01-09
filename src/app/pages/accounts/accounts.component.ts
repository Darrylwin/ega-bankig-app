import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { NbDialogService, NbToastrService } from '@nebular/theme';
import { LocalDataSource } from 'ng2-smart-table';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AccountApiService } from '../../@core/data/api/index';
import { Account, Page, PaginationParams } from '../../@core/data/models/index';
import { ConfirmDialogComponent } from '../../@core/components/confirm-dialog.component';

@Component({
  selector: 'ngx-accounts',
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.scss'],
})
export class AccountsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

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
  viewMode:  'table' | 'cards' = 'table';

  // Filtres
  filterOptions = {
    accountTypes: [
      { value: 'ALL', label: 'Tous les types' },
      { value:  'SAVINGS', label: 'Épargne' },
      { value: 'CURRENT', label: 'Courant' },
    ],
    statuses: [
      { value:  'ALL', label: 'Tous les statuts' },
      { value: 'ACTIVE', label: 'Actif' },
      { value: 'BLOCKED', label: 'Bloqué' },
      { value: 'CLOSED', label: 'Clos' },
    ],
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
      editButtonContent:  '<i class="nb-edit"></i>',
    },
    delete: {
      deleteButtonContent: '<i class="nb-trash"></i>',
      confirmDelete: true,
    },
    columns: {
      accountNumber: {
        title: 'N° Compte',
        type: 'string',
        filter: false,
        valuePrepareFunction: (value: string) => {
          return value ? value.match(/.{1,4}/g)?.join(' ') :  value;
        },
      },
      customerFullName: {
        title: 'Titulaire',
        type: 'string',
        filter: false,
      },
      accountType: {
        title: 'Type',
        type: 'html',
        filter: false,
        valuePrepareFunction: (value: string) => {
          if (value === 'SAVINGS') {
            return '<span class="badge badge-success">Épargne</span>';
          }
            return '<span class="badge badge-primary">Courant</span>';
          },
          },
          balance: {
          title: 'Solde',
          type: 'html',
          filter: false,
          valuePrepareFunction: (value: number) => {
            const formatted = new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
            currencyDisplay: 'symbol',
            }).format(value || 0).replace('XOF', 'F CFA');
            const color = value > 0 ? 'success' : value < 0 ? 'danger' : 'basic';
            return `<span class="text-${color} fw-bold">${formatted}</span>`;
          },
          },
          currency: {
          title: 'Devise',
          type: 'string',
          filter: false,
          },
          status: {
          title: 'Statut',
          type: 'html',
          filter: false,
          valuePrepareFunction: (value: string) => {
          const statusMap:  any = {
            ACTIVE: '<span class="badge badge-success">Actif</span>',
            BLOCKED: '<span class="badge badge-danger">Bloqué</span>',
            CLOSED: '<span class="badge badge-warning">Clos</span>',
          };
          return statusMap[value] || value;
        },
      },
      createdAt: {
        title: 'Date création',
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
    private router:  Router,
    private dialogService:  NbDialogService,
    private toastr: NbToastrService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charge les données
   */
  loadData(): void {
    this.isLoading = true;

    const params:  PaginationParams = {
      page: this.currentPage,
      size: this.pageSize,
      sort: 'createdAt,desc',
    };

    this.accountApi
      .getAccounts(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response:  Page<Account>) => {
          this.accounts = response.content;
          this.totalItems = response.totalElements;
          this. applyFilters();
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          this.toastr.danger('Erreur lors du chargement des comptes', 'Erreur');
          console.error(error);
        },
      });
  }

  /**
   * Applique les filtres
   */
  applyFilters(): void {
    let filtered = [... this.accounts];

    if (this.accountTypeFilter !== 'ALL') {
      filtered = filtered.filter((account) => account.accountType === this.accountTypeFilter);
    }

    if (this.statusFilter !== 'ALL') {
      filtered = filtered.filter((account) => account.status === this. statusFilter);
    }

    if (this.searchTerm. trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (account) =>
          account.accountNumber.toLowerCase().includes(term) ||
          account. customerFullName.toLowerCase().includes(term)
      );
    }

    this.source.load(filtered);
  }

  /**
   * Réinitialise les filtres
   */
  resetFilters(): void {
    this.searchTerm = '';
    this.accountTypeFilter = 'ALL';
    this. statusFilter = 'ALL';
    this.applyFilters();
  }

  /**
   * Change le mode d'affichage
   */
  setViewMode(mode: 'table' | 'cards'): void {
    this.viewMode = mode;
  }

  /**
   * Navigation vers la création
   */
  onCreate(): void {
    this.router. navigate(['/pages/accounts/new']);
  }

  /**
   * Navigation vers les détails
   */
  onView(event: any): void {
    const account = event.data as Account;
    this.router.navigate(['/pages/accounts/detail', account.id]);
  }

  /**
   * Navigation vers l'édition
   */
  onEdit(event: any): void {
    const account = event.data as Account;
    this.router.navigate(['/pages/accounts/detail', account.id]);
  }

  /**
   * Suppression d'un compte
   */
  onDelete(event: any): void {
    const account = event. data as Account;

    this. dialogService
      .open(ConfirmDialogComponent, {
        context: {
          title:  'Confirmer la suppression',
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
      .onClose.pipe(takeUntil(this. destroy$))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.deleteAccount(account.id);
        }
      });
  }

  /**
   * Supprime un compte
   */
  private deleteAccount(id: number): void {
    this.accountApi
      .deleteAccount(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastr.success('Compte supprimé avec succès', 'Succès');
          this.loadData();
        },
        error: (error) => {
          if (error.status === 409) {
            this.toastr.warning(
              'Impossible de supprimer un compte avec un solde non nul',
              'Attention'
            );
          } else if (error. status === 400) {
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
   * Helpers
   */
  formatAccountNumber(iban: string): string {
    return iban ?  iban.match(/.{1,4}/g)?.join(' ') || iban : '';
  }

  formatCurrency(amount: number): string {
    // Formate en francs CFA (XOF)
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      currencyDisplay: 'symbol',
    }).format(amount || 0).replace('XOF', 'F CFA');
  }

  formatNumber(num: number): string {
    return num?. toLocaleString('fr-FR') || '0';
  }
}