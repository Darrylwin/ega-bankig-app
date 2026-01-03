import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { NbDialogService, NbToastrService } from "@nebular/theme";
import { LocalDataSource } from "ng2-smart-table";
import { AccountApiService } from "../../@core/data/api/index";
import { Account, Page, PaginationParams } from "../../@core/data/models/index";
import { ConfirmDialogComponent } from "../../@core/components/confirm-dialog.component";

@Component({
  selector: "ngx-accounts",
  templateUrl: "./accounts.component.html",
  styleUrls: ["./accounts.component.scss"],
})
export class AccountsComponent implements OnInit {
  // Tableau
  settings = {
    actions: {
      columnTitle: "Actions",
      position: "right",
      add: false,
    },
    edit: {
      editButtonContent: '<i class="nb-edit" title="Voir détails"></i>',
      saveButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
    },
    delete: {
      deleteButtonContent: '<i class="nb-trash" title="Supprimer"></i>',
      confirmDelete: true,
    },
    columns: {
      accountNumber: {
        title: "N° Compte (IBAN)",
        type: "string",
        filter: true,
        valuePrepareFunction: (value: string) => {
          return value.replace(/(. {4})/g, "$1 ").trim();
        },
      },
      customerFullName: {
        title: "Client",
        type: "string",
        filter: true,
      },
      accountType: {
        title: "Type",
        type: "string",
        valuePrepareFunction: (value: string) => {
          return value === "SAVINGS" ? "Épargne" : "Courant";
        },
        filter: {
          type: "list",
          config: {
            selectText: "Tous",
            list: [
              { value: "SAVINGS", title: "Épargne" },
              { value: "CURRENT", title: "Courant" },
            ],
          },
        },
      },
      balance: {
        title: "Solde",
        type: "number",
        valuePrepareFunction: (value: number) => {
          return new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "EUR",
          }).format(value);
        },
        filter: false,
      },
      currency: {
        title: "Devise",
        type: "string",
        width: "80px",
        filter: false,
      },
      status: {
        title: "Statut",
        type: "html",
        valuePrepareFunction: (value: string) => {
          const statusMap: any = {
            ACTIVE: '<span class="badge badge-success">Actif</span>',
            BLOCKED: '<span class="badge badge-danger">Bloqué</span>',
            CLOSED: '<span class="badge badge-warning">Clos</span>',
          };
          return statusMap[value] || value;
        },
        filter: {
          type: "list",
          config: {
            selectText: "Tous",
            list: [
              { value: "ACTIVE", title: "Actif" },
              { value: "BLOCKED", title: "Bloqué" },
              { value: "CLOSED", title: "Clos" },
            ],
          },
        },
      },
      createdAt: {
        title: "Ouvert le",
        type: "string",
        valuePrepareFunction: (value: string) => {
          return new Date(value).toLocaleDateString("fr-FR");
        },
        filter: false,
      },
    },
    mode: "external",
    pager: {
      display: true,
      perPage: 10,
    },
    noDataMessage: "Aucun compte trouvé",
  };

  // Données
  source = new LocalDataSource();
  accounts: Account[] = [];
  totalItems = 0;
  pageSize = 10;
  currentPage = 0;

  // États
  isLoading = false;
  searchTerm = "";
  accountTypeFilter = "ALL";
  statusFilter = "ALL";

  // Vue active
  viewMode: "table" | "cards" | "stats" = "table";

  // Filtres
  filterOptions = {
    accountTypes: [
      { value: "ALL", label: "Tous les types" },
      { value: "SAVINGS", label: "Épargne" },
      { value: "CURRENT", label: "Courant" },
    ],
    statuses: [
      { value: "ALL", label: "Tous les statuts" },
      { value: "ACTIVE", label: "Actif" },
      { value: "BLOCKED", label: "Bloqué" },
      { value: "CLOSED", label: "Clos" },
    ],
  };

  // Statistiques
  accountStats = {
    totalAccounts: 0,
    savingsCount: 0,
    currentCount: 0,
    activeCount: 0,
    blockedCount: 0,
    closedCount: 0,
    totalBalance: 0,
    averageBalance: 0,
    highestBalance: 0,
    lowestBalance: 0,
    currencyBreakdown: [] as {
      currency: string;
      count: number;
      totalBalance: number;
    }[],
  };

  // Données graphiques
  accountTypeDistributionData: any[] = [];
  accountStatusDistributionData: any[] = [];
  balanceDistributionData: any[] = [];
  currencyDistributionData: any[] = [];
  accountGrowthTrendData: any[] = [];

  // Options graphiques
  colorScheme = {
    domain: ["#3366FF", "#00D68F", "#FFAA00", "#FF3D71", "#00E096", "#A366FF"],
  };

  constructor(
    private accountApi: AccountApiService,
    private router: Router,
    private dialogService: NbDialogService,
    private toastr: NbToastrService
  ) {}

  ngOnInit(): void {
    this.loadAccounts();
  }

  /**
   * Charge la liste des comptes
   */
  loadAccounts(): void {
    this.isLoading = true;

    const params: PaginationParams = {
      page: this.currentPage,
      size: this.pageSize,
      sort: "createdAt,desc",
    };

    this.accountApi.getAccounts(params).subscribe({
      next: (response: Page<Account>) => {
        this.accounts = response.content;
        this.totalItems = response.totalElements;
        this.applyFilters();
        this.calculateStatistics();
        this.prepareChartData();
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.toastr.danger("Erreur lors du chargement des comptes", "Erreur");
        console.error("Erreur chargement comptes:", error);
      },
    });
  }

  /**
   * Calcule les statistiques des comptes
   */
  private calculateStatistics(): void {
    this.accountStats.totalAccounts = this.accounts.length;
    this.accountStats.savingsCount = this.accounts.filter(
      (a) => a.accountType === "SAVINGS"
    ).length;
    this.accountStats.currentCount = this.accounts.filter(
      (a) => a.accountType === "CURRENT"
    ).length;
    this.accountStats.activeCount = this.accounts.filter(
      (a) => a.status === "ACTIVE"
    ).length;
    this.accountStats.blockedCount = this.accounts.filter(
      (a) => a.status === "BLOCKED"
    ).length;
    this.accountStats.closedCount = this.accounts.filter(
      (a) => a.status === "CLOSED"
    ).length;

    // Calculs financiers
    this.accountStats.totalBalance = this.accounts.reduce(
      (sum, a) => sum + a.balance,
      0
    );
    this.accountStats.averageBalance =
      this.accountStats.totalAccounts > 0
        ? this.accountStats.totalBalance / this.accountStats.totalAccounts
        : 0;

    const balances = this.accounts.map((a) => a.balance).sort((a, b) => b - a);
    this.accountStats.highestBalance = balances[0] || 0;
    this.accountStats.lowestBalance = balances[balances.length - 1] || 0;

    // Répartition par devise
    const currencyMap: {
      [key: string]: { count: number; totalBalance: number };
    } = {};
    this.accounts.forEach((account) => {
      if (!currencyMap[account.currency]) {
        currencyMap[account.currency] = { count: 0, totalBalance: 0 };
      }
      currencyMap[account.currency].count++;
      currencyMap[account.currency].totalBalance += account.balance;
    });

    this.accountStats.currencyBreakdown = Object.entries(currencyMap)
      .map(([currency, data]) => ({ currency, ...data }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Prépare les données pour les graphiques
   */
  private prepareChartData(): void {
    // Graphique 1: Répartition par type
    this.accountTypeDistributionData = [
      { name: "Comptes Épargne", value: this.accountStats.savingsCount },
      { name: "Comptes Courants", value: this.accountStats.currentCount },
    ].filter((item) => item.value > 0);

    // Graphique 2: Répartition par statut
    this.accountStatusDistributionData = [
      { name: "Actifs", value: this.accountStats.activeCount },
      { name: "Bloqués", value: this.accountStats.blockedCount },
      { name: "Clos", value: this.accountStats.closedCount },
    ].filter((item) => item.value > 0);

    // Graphique 3: Répartition des soldes par tranche
    this.balanceDistributionData = this.generateBalanceDistribution();

    // Graphique 4: Répartition par devise
    this.currencyDistributionData = this.accountStats.currencyBreakdown.map(
      (c) => ({
        name: c.currency,
        value: c.count,
      })
    );

    // Graphique 5: Tendance d'ouverture de comptes (simulation 6 mois)
    this.accountGrowthTrendData = this.generateAccountGrowthTrend();
  }

  /**
   * Génère la distribution des soldes par tranches
   */
  private generateBalanceDistribution(): any[] {
    const ranges = [
      { name: "0 - 1K€", min: 0, max: 1000 },
      { name: "1K - 5K€", min: 1000, max: 5000 },
      { name: "5K - 10K€", min: 5000, max: 10000 },
      { name: "10K - 50K€", min: 10000, max: 50000 },
      { name: "50K+€", min: 50000, max: Infinity },
    ];

    return ranges
      .map((range) => ({
        name: range.name,
        value: this.accounts.filter(
          (a) => a.balance >= range.min && a.balance < range.max
        ).length,
      }))
      .filter((item) => item.value > 0);
  }

  /**
   * Génère la tendance d'ouverture de comptes (simulation)
   */
  private generateAccountGrowthTrend(): any[] {
    const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin"];
    return [
      {
        name: "Nouveaux comptes",
        series: months.map((month, index) => ({
          name: month,
          value: Math.floor(Math.random() * 15) + 5 + index * 3,
        })),
      },
    ];
  }

  /**
   * Change le mode d'affichage
   */
  setViewMode(mode: "table" | "cards" | "stats"): void {
    this.viewMode = mode;
  }

  /**
   * Applique les filtres
   */
  applyFilters(): void {
    let filtered = this.accounts;

    // Filtre par type
    if (this.accountTypeFilter !== "ALL") {
      filtered = filtered.filter(
        (account) => account.accountType === this.accountTypeFilter
      );
    }

    // Filtre par statut
    if (this.statusFilter !== "ALL") {
      filtered = filtered.filter(
        (account) => account.status === this.statusFilter
      );
    }

    // Filtre par recherche
    if (this.searchTerm.trim()) {
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
   * Création d'un nouveau compte
   */
  onCreate(): void {
    this.router.navigate(["/pages/accounts/new"]);
  }

  /**
   * Voir les détails d'un compte
   */
  onView(event: any): void {
    const account = event.data as Account;
    this.router.navigate(["/pages/accounts/detail", account.id]);
  }

  /**
   * Suppression d'un compte
   */
  onDelete(event: any): void {
    const account = event.data as Account;

    this.dialogService
      .open(ConfirmDialogComponent, {
        context: {
          title: "Confirmer la suppression",
          message: `Êtes-vous sûr de vouloir supprimer le compte ${this.formatAccountNumber(
            account.accountNumber
          )} ?<br><small>Solde: ${this.formatCurrency(
            account.balance
          )}</small>`,
          confirmText: "Supprimer",
          cancelText: "Annuler",
          status: "danger",
        },
      })
      .onClose.subscribe((confirmed) => {
        if (confirmed) {
          this.deleteAccount(account.id);
        }
      });
  }

  /**
   * Supprime un compte
   */
  private deleteAccount(id: number): void {
    this.accountApi.deleteAccount(id).subscribe({
      next: () => {
        this.toastr.success("Compte supprimé avec succès", "Succès");
        this.loadAccounts();
      },
      error: (error) => {
        if (error.status === 409) {
          this.toastr.warning(
            "Impossible de supprimer :  compte avec solde non nul",
            "Attention"
          );
        } else if (error.status === 400) {
          this.toastr.warning(
            "Impossible de supprimer : compte avec transactions actives",
            "Attention"
          );
        } else {
          this.toastr.danger("Erreur lors de la suppression", "Erreur");
        }
      },
    });
  }

  /**
   * Génère un relevé
   */
  generateStatement(account: Account): void {
    this.router.navigate(["/pages/accounts/statement", account.id]);
  }

  /**
   * Export CSV
   */
  exportToCSV(): void {
    const csvContent = this.convertToCSV(this.accounts);
    this.downloadCSV(
      csvContent,
      `comptes_${new Date().toISOString().split("T")[0]}.csv`
    );
    this.toastr.success("Export CSV réussi", "Succès");
  }

  /**
   * Export PDF (simulation)
   */
  exportToPDF(): void {
    this.toastr.info("Génération du PDF en cours...", "Export PDF");
    setTimeout(() => {
      this.toastr.success("Export PDF réussi", "Succès");
    }, 1500);
  }

  private convertToCSV(accounts: Account[]): string {
    const headers = [
      "N° Compte",
      "Client",
      "Type",
      "Solde",
      "Devise",
      "Statut",
      "Ouvert le",
    ];
    const rows = accounts.map((a) => [
      a.accountNumber,
      a.customerFullName,
      a.accountType === "SAVINGS" ? "Épargne" : "Courant",
      this.formatCurrency(a.balance),
      a.currency,
      a.status === "ACTIVE"
        ? "Actif"
        : a.status === "BLOCKED"
        ? "Bloqué"
        : "Clos",
      new Date(a.createdAt).toLocaleDateString("fr-FR"),
    ]);

    return [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");
  }

  private downloadCSV(content: string, filename: string): void {
    const blob = new Blob(["\ufeff" + content], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }

  /**
   * Formate le numéro de compte
   */
  formatAccountNumber(iban: string): string {
    return iban.replace(/(. {4})/g, "$1 ").trim();
  }

  /**
   * Formate la monnaie
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  }

  /**
   * Formate un nombre
   */
  formatNumber(num: number): string {
    return num.toLocaleString("fr-FR");
  }

  /**
   * Calcule un pourcentage
   */
  calculatePercentage(part: number, total: number): number {
    return total > 0 ? Math.round((part / total) * 100) : 0;
  }

  /**
   * Réinitialise les filtres
   */
  resetFilters(): void {
    this.searchTerm = "";
    this.accountTypeFilter = "ALL";
    this.statusFilter = "ALL";
    this.applyFilters();
  }

  /**
   * Navigation pagination
   */
  goToFirstPage(): void {
    this.currentPage = 0;
    this.loadAccounts();
  }

  goToPreviousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadAccounts();
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadAccounts();
    }
  }

  goToLastPage(): void {
    this.currentPage = this.totalPages - 1;
    this.loadAccounts();
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  get currentPageDisplay(): number {
    return this.currentPage + 1;
  }
}
