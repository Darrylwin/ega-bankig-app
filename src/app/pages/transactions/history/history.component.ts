import { Component, OnInit, OnDestroy } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { NbToastrService, NbDialogService } from "@nebular/theme";
import { LocalDataSource } from "ng2-smart-table";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import {
  Transaction,
  Account,
  PaginationParams,
  Page,
} from "../../../@core/data/models/index";
import {
  TransactionApiService,
  AccountApiService,
} from "../../../@core/data/api/index";
import { ConfirmDialogComponent } from "../../../@core/components/confirm-dialog.component";

@Component({
  selector: "ngx-history",
  templateUrl: "./history.component.html",
  styleUrls: ["./history.component.scss"],
})
export class HistoryComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Données
  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  accounts: Account[] = [];
  totalItems = 0;
  pageSize = 15;
  currentPage = 0;

  // Filtres
  selectedAccountId: string = "ALL";
  selectedType: string = "ALL";
  selectedStatus: string = "ALL";
  startDate: string = "";
  endDate: string = "";
  searchTerm: string = "";

  // États
  isLoading = false;
  accountIdFromRoute: number | null = null;

  // Vue active
  viewMode: "table" | "timeline" = "table";

  // Options
  filterOptions = {
    types: [
      { value: "ALL", label: "Tous les types", icon: "list-outline" },
      { value: "DEPOSIT", label: "Dépôts", icon: "trending-up-outline" },
      {
        value: "WITHDRAWAL",
        label: "Retraits",
        icon: "trending-down-outline",
      },
      { value: "TRANSFER", label: "Virements", icon: "swap-outline" },
    ],
    statuses: [
      { value: "ALL", label: "Tous les statuts" },
      { value: "SUCCESS", label: "Succès" },
      { value: "PENDING", label: "En attente" },
      { value: "FAILED", label: "Échoué" },
    ],
  };

  // Période actuelle
  currentPeriod: string = "month";

  // Tableau
  source = new LocalDataSource();
  settings = {
    actions: {
      columnTitle: "Actions",
      position: "right",
      add: false,
      edit: false,
      delete: false,
      custom: [
        {
          name: "view",
          title: '<i class="nb-search" title="Voir détails"></i>',
        },
      ],
    },
    columns: {
      transactionDate: {
        title: "Date & Heure",
        type: "string",
        valuePrepareFunction: (value: string) => {
          return new Date(value).toLocaleString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        },
        filter: false,
        width: "12%",
      },
      transactionType: {
        title: "Type",
        type: "html",
        valuePrepareFunction: (value: string, row: Transaction) => {
          const types: any = {
            DEPOSIT:
              '<span class="badge badge-success"><i class="nb-arrow-up"></i> Dépôt</span>',
            WITHDRAWAL:
              '<span class="badge badge-danger"><i class="nb-arrow-down"></i> Retrait</span>',
            TRANSFER: {
              true: '<span class="badge badge-primary"><i class="nb-arrow-down"></i> Virement reçu</span>',
              false: '<span class="badge badge-primary"><i class="nb-arrow-up"></i> Virement envoyé</span>',
            },
          };
          
          if (value === "TRANSFER") {
            const isIncoming = this.isIncomingTransfer(row);
            return types[value][isIncoming.toString()] || '<span class="badge badge-primary">Virement</span>';
          }
          
          return types[value] || value;
        },
        filter: false,
        width: "10%",
      },
      amount: {
        title: "Montant",
        type: "html",
        valuePrepareFunction: (value: number, row: Transaction) => {
          const isIncoming = this.isIncomingTransfer(row);
          const isCredit = row.transactionType === "DEPOSIT" || isIncoming;
          const formatted = this.formatCurrency(Math.abs(value));
          const color = isCredit ? "text-success" : "text-danger";
          const icon = isCredit ? '<i class="nb-plus"></i> ' : '<i class="nb-minus"></i> ';
          
          return `<span class="${color} fw-bold">${icon}${formatted}</span>`;
        },
        filter: false,
        width: "12%",
      },
      balanceAfter: {
        title: "Solde après",
        type: "string",
        valuePrepareFunction: (value: number, row: Transaction) => {
          const displayBalance = this.getDisplayBalance(row, false);
          return this.formatCurrency(displayBalance);
        },
        filter: false,
        width: "12%",
      },
      status: {
        title: "Statut",
        type: "html",
        valuePrepareFunction: (value: string) => {
          const statusMap: any = {
            PENDING:
              '<span class="badge badge-warning"><i class="nb-loop-outline"></i> En attente</span>',
            SUCCESS:
              '<span class="badge badge-success"><i class="nb-checkmark"></i> Succès</span>',
            FAILED:
              '<span class="badge badge-danger"><i class="nb-close"></i> Échoué</span>',
          };
          return statusMap[value] || value;
        },
        filter: false,
        width: "10%",
      },
      description: {
        title: "Description",
        type: "string",
        valuePrepareFunction: (value: string) => {
          return value || "—";
        },
        filter: false,
        width: "14%",
      },
    },
    mode: "external",
    pager: {
      display: false,
    },
    noDataMessage: "Aucune transaction trouvée",
  };

  // Statistiques
  stats = {
    totalTransactions: 0,
    depositsCount: 0,
    withdrawalsCount: 0,
    transfersCount: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalTransfers: 0,
    successCount: 0,
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private transactionApi: TransactionApiService,
    private accountApi: AccountApiService,
    private toastr: NbToastrService,
    private dialogService: NbDialogService
  ) {}

  ngOnInit(): void {
    // Récupérer l'ID du compte depuis l'URL si présent
    const accountId = this.route.snapshot.params["accountId"];
    if (accountId) {
      this.accountIdFromRoute = +accountId;
      this.selectedAccountId = accountId.toString();
    }

    this.loadAccounts();
    this.setDefaultDates();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Définit les dates par défaut (ce mois)
   */
  private setDefaultDates(): void {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    this.startDate = firstDay.toISOString().split("T")[0];
    this.endDate = today.toISOString().split("T")[0];
    this.currentPeriod = "month";
  }

  /**
   * Charge la liste des comptes
   */
  private loadAccounts(): void {
    this.isLoading = true;
    
    const params: PaginationParams = {
      page: 0,
      size: 100,
      sort: "accountNumber,asc",
    };

    this.accountApi
      .getAccounts(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: Page<Account>) => {
          this.accounts = response.content;
          this.isLoading = false;

          // Charger les transactions après avoir chargé les comptes
          if (this.selectedAccountId !== "ALL") {
            this.loadTransactions();
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error("Erreur chargement comptes:", error);
          this.toastr.danger("Erreur lors du chargement des comptes", "Erreur");
        },
      });
  }

  /**
   * Charge les transactions
   */
  loadTransactions(): void {
    if (this.selectedAccountId === "ALL") {
      this.toastr.info("Veuillez sélectionner un compte", "Information");
      this.transactions = [];
      this.filteredTransactions = [];
      this.applyFilters();
      return;
    }

    this.isLoading = true;
    const accountId = +this.selectedAccountId;

    if (this.startDate && this.endDate) {
      // Convertir en ISO avec heures
      const startISO = `${this.startDate}T00:00:00`;
      const endISO = `${this.endDate}T23:59:59`;

      this.transactionApi
        .getTransactionsByPeriod(accountId, startISO, endISO)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (transactions) => {
            this.transactions = transactions;
            this.applyFilters();
            this.calculateStatistics();
            this.isLoading = false;
          },
          error: (error) => {
            this.isLoading = false;
            this.toastr.danger(
              "Erreur lors du chargement des transactions",
              "Erreur"
            );
            console.error(error);
          },
        });
    } else {
      this.transactionApi
        .getTransactionsByAccount(accountId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (transactions) => {
            this.transactions = transactions;
            this.applyFilters();
            this.calculateStatistics();
            this.isLoading = false;
          },
          error: (error) => {
            this.isLoading = false;
            this.toastr.danger(
              "Erreur lors du chargement des transactions",
              "Erreur"
            );
            console.error(error);
          },
        });
    }
  }

  /**
   * Applique les filtres
   */
  applyFilters(): void {
    let filtered = [...this.transactions];

    // Filtre par type
    if (this.selectedType !== "ALL") {
      filtered = filtered.filter(
        (tx) => tx.transactionType === this.selectedType
      );
    }

    // Filtre par statut
    if (this.selectedStatus !== "ALL") {
      filtered = filtered.filter((tx) => tx.status === this.selectedStatus);
    }

    // Filtre par recherche
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (tx) =>
          tx.description?.toLowerCase().includes(term) ||
          tx.transactionReference.toLowerCase().includes(term) ||
          tx.sourceAccountNumber.toLowerCase().includes(term) ||
          (tx.destinationAccountNumber &&
            tx.destinationAccountNumber.toLowerCase().includes(term))
      );
    }

    // Trier par date décroissante
    filtered.sort(
      (a, b) =>
        new Date(b.transactionDate).getTime() -
        new Date(a.transactionDate).getTime()
    );

    this.filteredTransactions = filtered;
    this.totalItems = filtered.length;
    this.currentPage = 0; // Réinitialiser la pagination
    this.source.load(filtered);
  }

  /**
   * Calcule les statistiques
   */
  private calculateStatistics(): void {
    this.stats.totalTransactions = this.filteredTransactions.length;

    this.stats.depositsCount = this.filteredTransactions.filter(
      (t) => t.transactionType === "DEPOSIT"
    ).length;

    this.stats.withdrawalsCount = this.filteredTransactions.filter(
      (t) => t.transactionType === "WITHDRAWAL"
    ).length;

    this.stats.transfersCount = this.filteredTransactions.filter(
      (t) => t.transactionType === "TRANSFER"
    ).length;

    this.stats.totalDeposits = this.filteredTransactions
      .filter((t) => t.transactionType === "DEPOSIT")
      .reduce((sum, t) => sum + t.amount, 0);

    this.stats.totalWithdrawals = this.filteredTransactions
      .filter((t) => t.transactionType === "WITHDRAWAL")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    this.stats.successCount = this.filteredTransactions.filter(
      (t) => t.status === "SUCCESS"
    ).length;
  }

  /**
   * Périodes rapides
   */
  setToday(): void {
    const today = new Date();
    this.startDate = today.toISOString().split("T")[0];
    this.endDate = today.toISOString().split("T")[0];
    this.currentPeriod = "today";
    this.loadTransactions();
  }

  setYesterday(): void {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    this.startDate = yesterday.toISOString().split("T")[0];
    this.endDate = yesterday.toISOString().split("T")[0];
    this.currentPeriod = "yesterday";
    this.loadTransactions();
  }

  setLast7Days(): void {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    this.startDate = sevenDaysAgo.toISOString().split("T")[0];
    this.endDate = today.toISOString().split("T")[0];
    this.currentPeriod = "week";
    this.loadTransactions();
  }

  setLast30Days(): void {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    this.startDate = thirtyDaysAgo.toISOString().split("T")[0];
    this.endDate = today.toISOString().split("T")[0];
    this.currentPeriod = "30days";
    this.loadTransactions();
  }

  setCurrentMonth(): void {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    this.startDate = firstDay.toISOString().split("T")[0];
    this.endDate = today.toISOString().split("T")[0];
    this.currentPeriod = "month";
    this.loadTransactions();
  }

  setLastMonth(): void {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
    this.startDate = firstDay.toISOString().split("T")[0];
    this.endDate = lastDay.toISOString().split("T")[0];
    this.currentPeriod = "lastMonth";
    this.loadTransactions();
  }

  setCurrentYear(): void {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), 0, 1);
    this.startDate = firstDay.toISOString().split("T")[0];
    this.endDate = today.toISOString().split("T")[0];
    this.currentPeriod = "year";
    this.loadTransactions();
  }

  /**
   * Réinitialise les filtres
   */
  resetFilters(): void {
    this.selectedType = "ALL";
    this.selectedStatus = "ALL";
    this.searchTerm = "";
    this.setDefaultDates();
    if (this.selectedAccountId !== "ALL") {
      this.loadTransactions();
    } else {
      this.applyFilters();
    }
  }

  /**
   * Change le mode d'affichage
   */
  setViewMode(mode: "table" | "timeline"): void {
    this.viewMode = mode;
  }

  /**
   * Action personnalisée du tableau
   */
  onCustomAction(event: any): void {
    if (event.action === "view") {
      this.showTransactionDetails(event.data);
    }
  }

  /**
   * Affiche les détails d'une transaction
   */
  showTransactionDetails(transaction: Transaction): void {
    const selectedAccount = this.accounts.find(
      (acc) => acc.id === +this.selectedAccountId
    );
    const currentAccountNumber = selectedAccount?.accountNumber || "";
    const isIncoming = this.isIncomingTransfer(transaction);
    const displayBalance = this.getDisplayBalance(transaction, false);

    this.dialogService.open(ConfirmDialogComponent, {
      context: {
        title: "Détails de la transaction",
        message: `
          <div class="transaction-details-modal">
            <div class="detail-row">
              <strong>Référence :</strong> ${transaction.transactionReference}
            </div>
            <div class="detail-row">
              <strong>Type :</strong> ${this.getTransactionLabel(transaction.transactionType, isIncoming)}
            </div>
            <div class="detail-row">
              <strong>Date :</strong> ${this.formatDateTime(transaction.transactionDate)}
            </div>
            <div class="detail-row">
              <strong>Montant :</strong> 
              <span class="${isIncoming || transaction.transactionType === 'DEPOSIT' ? 'text-success' : 'text-danger'}">
                ${isIncoming || transaction.transactionType === 'DEPOSIT' ? '+' : '-'}${this.formatCurrency(Math.abs(transaction.amount))}
              </span>
            </div>
            <div class="detail-row">
              <strong>Solde après :</strong> ${this.formatCurrency(displayBalance)}
            </div>
            <div class="detail-row">
              <strong>Statut :</strong> ${this.getStatusLabel(transaction.status)}
            </div>
            ${transaction.description ? `<div class="detail-row"><strong>Description :</strong> ${transaction.description}</div>` : ''}
            ${transaction.sourceAccountNumber ? `<div class="detail-row"><strong>Compte source :</strong> ${this.formatAccountNumber(transaction.sourceAccountNumber)}</div>` : ''}
            ${transaction.destinationAccountNumber ? `<div class="detail-row"><strong>Compte destination :</strong> ${this.formatAccountNumber(transaction.destinationAccountNumber)}</div>` : ''}
          </div>
        `,
        confirmText: "Fermer",
        cancelText: "",
        status: "info",
      },
    });
  }

  /**
   * Helpers
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  formatAccountNumber(iban: string): string {
    return iban ? iban.match(/.{1,4}/g)?.join(" ") || iban : "";
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  formatNumber(num: number): string {
    return num.toLocaleString("fr-FR");
  }

  getTransactionIcon(type: string): string {
    const icons: any = {
      DEPOSIT: "trending-up-outline",
      WITHDRAWAL: "trending-down-outline",
      TRANSFER: "swap-outline",
    };
    return icons[type] || "repeat-outline";
  }

  getTransactionLabel(type: string, isIncoming: boolean = false): string {
    const labels: any = {
      DEPOSIT: "Dépôt",
      WITHDRAWAL: "Retrait",
      TRANSFER: isIncoming ? "Virement reçu" : "Virement envoyé",
    };
    return labels[type] || type;
  }

  getTransactionColor(type: string, isIncoming: boolean = false): string {
    const colors: any = {
      DEPOSIT: "success",
      WITHDRAWAL: "danger",
      TRANSFER: isIncoming ? "success" : "primary",
    };
    return colors[type] || "basic";
  }

  getStatusLabel(status: string): string {
    const labels: any = {
      SUCCESS: "Succès",
      PENDING: "En attente",
      FAILED: "Échoué",
    };
    return labels[status] || status;
  }

  getStatusColor(status: string): string {
    const colors: any = {
      SUCCESS: "success",
      PENDING: "warning",
      FAILED: "danger",
    };
    return colors[status] || "basic";
  }

  isIncomingTransfer(transaction: Transaction): boolean {
    if (transaction.transactionType !== "TRANSFER") {
      return false;
    }

    const selectedAccount = this.accounts.find(
      (acc) => acc.id === +this.selectedAccountId
    );
    if (!selectedAccount) {
      return false;
    }

    // Si le compte courant est le compte destination, c'est un virement reçu
    return transaction.destinationAccountNumber === selectedAccount.accountNumber;
  }

  getDisplayBalance(transaction: Transaction, before: boolean = false): number {
    const isIncoming = this.isIncomingTransfer(transaction);
    
    if (isIncoming) {
      // Pour un virement reçu, utiliser le solde du compte destination
      return before ? transaction.balanceBefore : transaction.balanceAfter;
    } else {
      // Pour les autres transactions, utiliser le solde normal
      return before ? transaction.balanceBefore : transaction.balanceAfter;
    }
  }

  getNetBalance(): number {
    return this.stats.totalDeposits - this.stats.totalWithdrawals;
  }

  getSuccessRate(): number {
    return this.stats.totalTransactions > 0
      ? (this.stats.successCount / this.stats.totalTransactions) * 100
      : 0;
  }

  // Pagination methods (similaires à customers)
  goToFirstPage(): void {
    this.currentPage = 0;
    this.applyFilters();
  }

  goToPreviousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.applyFilters();
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.applyFilters();
    }
  }

  goToLastPage(): void {
    this.currentPage = this.totalPages - 1;
    this.applyFilters();
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  get currentPageDisplay(): number {
    return this.currentPage + 1;
  }

  get pagedTransactions(): Transaction[] {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredTransactions.slice(startIndex, endIndex);
  }
}