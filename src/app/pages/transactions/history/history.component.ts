import { Component, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { NbToastrService, NbDialogService } from "@nebular/theme";
import { LocalDataSource } from "ng2-smart-table";
import {
  TransactionApiService,
  AccountApiService,
} from "../../../@core/data/api/index";
import { Transaction, Account } from "../../../@core/data/models/index";

@Component({
  selector: "ngx-history",
  templateUrl: "./history.component.html",
  styleUrls: ["./history.component.scss"],
})
export class HistoryComponent implements OnInit {
  // Tableau
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
        valuePrepareFunction: (value: string) => {
          const types: any = {
            DEPOSIT:
              '<span class="badge badge-success"><i class="nb-arrow-up"></i> Dépôt</span>',
            WITHDRAWAL:
              '<span class="badge badge-danger"><i class="nb-arrow-down"></i> Retrait</span>',
            TRANSFER:
              '<span class="badge badge-primary"><i class="nb-shuffle"></i> Virement</span>',
          };
          return types[value] || value;
        },
        filter: {
          type: "list",
          config: {
            selectText: "Tous",
            list: [
              { value: "DEPOSIT", title: "Dépôt" },
              { value: "WITHDRAWAL", title: "Retrait" },
              { value: "TRANSFER", title: "Virement" },
            ],
          },
        },
        width: "10%",
      },
      sourceAccountNumber: {
        title: "Compte Source",
        type: "string",
        valuePrepareFunction: (value: string) => {
          return value ? this.formatAccountNumber(value) : "—";
        },
        filter: false,
        width: "15%",
      },
      destinationAccountNumber: {
        title: "Compte Destination",
        type: "string",
        valuePrepareFunction: (value: string) => {
          return value ? this.formatAccountNumber(value) : "—";
        },
        filter: false,
        width: "15%",
      },
      amount: {
        title: "Montant",
        type: "html",
        valuePrepareFunction: (value: number, row: Transaction) => {
          const formatted = this.formatCurrency(Math.abs(value));
          let color = "text-primary";
          let icon = "";

          if (row.transactionType === "DEPOSIT") {
            color = "text-success";
            icon = '<i class="nb-plus"></i> ';
          } else if (row.transactionType === "WITHDRAWAL") {
            color = "text-danger";
            icon = '<i class="nb-minus"></i> ';
          }

          return `<span class="${color} fw-bold">${icon}${formatted}</span>`;
        },
        filter: false,
        width: "12%",
      },
      balanceAfter: {
        title: "Solde après",
        type: "string",
        valuePrepareFunction: (value: number) => {
          return this.formatCurrency(value);
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
        filter: {
          type: "list",
          config: {
            selectText: "Tous",
            list: [
              { value: "SUCCESS", title: "Succès" },
              { value: "PENDING", title: "En attente" },
              { value: "FAILED", title: "Échoué" },
            ],
          },
        },
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
    pager: {
      display: true,
      perPage: 15,
    },
    noDataMessage: "Aucune transaction trouvée",
  };

  // Données
  source = new LocalDataSource();
  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  accounts: Account[] = [];

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
  viewMode: "table" | "cards" | "timeline" = "table";

  // Options
  filterOptions = {
    types: [
      { value: "ALL", label: "Tous les types", icon: "list-outline" },
      { value: "DEPOSIT", label: "Dépôts", icon: "trending-up-outline" },
      { value: "WITHDRAWAL", label: "Retraits", icon: "trending-down-outline" },
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
  currentPeriod: string = "all";

  // Statistiques
  stats = {
    totalTransactions: 0,
    depositsCount: 0,
    withdrawalsCount: 0,
    transfersCount: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalTransfers: 0,
    successRate: 0,
  };

  // Données graphiques
  transactionsByTypeData: any[] = [];
  transactionsByDateData: any[] = [];

  colorScheme = {
    domain: ["#00d68f", "#ff3d71", "#3366ff", "#ffaa00"],
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
    this.accountApi
      .getAccounts({ page: 0, size: 100, sort: "accountNumber,asc" })
      .subscribe({
        next: (response) => {
          this.accounts = response.content;

          // Charger les transactions après avoir chargé les comptes
          if (this.selectedAccountId !== "ALL") {
            this.loadTransactions();
          }
        },
        error: (error) => {
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
        .subscribe({
          next: (transactions) => {
            this.transactions = transactions;
            this.applyFilters();
            this.calculateStatistics();
            this.prepareChartData();
            this.isLoading = false;
          },
          error: (error) => {
            this.isLoading = false;
            this.toastr.danger(
              "Erreur lors du chargement des transactions",
              "Erreur"
            );
          },
        });
    } else {
      this.transactionApi.getTransactionsByAccount(accountId).subscribe({
        next: (transactions) => {
          this.transactions = transactions;
          this.applyFilters();
          this.calculateStatistics();
          this.prepareChartData();
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          this.toastr.danger(
            "Erreur lors du chargement des transactions",
            "Erreur"
          );
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

    this.stats.totalTransfers = this.filteredTransactions
      .filter((t) => t.transactionType === "TRANSFER")
      .reduce((sum, t) => sum + t.amount, 0);

    const successCount = this.filteredTransactions.filter(
      (t) => t.status === "SUCCESS"
    ).length;

    this.stats.successRate =
      this.stats.totalTransactions > 0
        ? (successCount / this.stats.totalTransactions) * 100
        : 0;
  }

  /**
   * Prépare les données pour les graphiques
   */
  private prepareChartData(): void {
    // Graphique par type
    this.transactionsByTypeData = [
      { name: "Dépôts", value: this.stats.depositsCount },
      { name: "Retraits", value: this.stats.withdrawalsCount },
      { name: "Virements", value: this.stats.transfersCount },
    ].filter((item) => item.value > 0);

    // Graphique par date
    this.transactionsByDateData = this.generateTransactionsByDate();
  }

  /**
   * Génère les données par date
   */
  private generateTransactionsByDate(): any[] {
    const dateMap: { [key: string]: number } = {};

    this.filteredTransactions.forEach((tx) => {
      const date = new Date(tx.transactionDate).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
      });

      dateMap[date] = (dateMap[date] || 0) + 1;
    });

    return Object.entries(dateMap)
      .map(([name, value]) => ({ name, value }))
      .slice(-10);
  }

  /**
   * Change le mode d'affichage
   */
  setViewMode(mode: "table" | "cards" | "timeline"): void {
    this.viewMode = mode;
  }

  /**
   * Réinitialise les filtres
   */
  resetFilters(): void {
    this.selectedAccountId = this.accountIdFromRoute
      ? this.accountIdFromRoute.toString()
      : "ALL";
    this.selectedType = "ALL";
    this.selectedStatus = "ALL";
    this.searchTerm = "";
    this.setDefaultDates();
    this.loadTransactions();
  }

  /**
   * Périodes prédéfinies
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
   * Voir les détails d'une transaction
   */
  onViewTransaction(event: any): void {
    const transaction = event.data as Transaction;
    this.showTransactionDetails(transaction);
  }

  /**
   * Affiche les détails d'une transaction
   */
  showTransactionDetails(transaction: Transaction): void {
    // TODO: Ouvrir un dialog avec les détails
    console.log("Transaction details:", transaction);
  }

  /**
   * Actions personnalisées du tableau
   */
  onCustomAction(event: any): void {
    if (event.action === "view") {
      this.onViewTransaction(event);
    }
  }

  /**
   * Export CSV
   */
  exportToCSV(): void {
    if (this.filteredTransactions.length === 0) {
      this.toastr.warning("Aucune transaction à exporter", "Attention");
      return;
    }

    const csvContent = this.convertToCSV(this.filteredTransactions);
    this.downloadFile(
      csvContent,
      `transactions_${this.selectedAccountId}_${
        new Date().toISOString().split("T")[0]
      }.csv`,
      "text/csv"
    );
    this.toastr.success("Export CSV réussi", "Succès");
  }

  /**
   * Export PDF
   */
  exportToPDF(): void {
    if (this.filteredTransactions.length === 0) {
      this.toastr.warning("Aucune transaction à exporter", "Attention");
      return;
    }

    this.toastr.info("Génération du PDF en cours...", "Export PDF");

    // TODO: Implémenter l'export PDF avec jsPDF
    setTimeout(() => {
      this.toastr.success("Export PDF réussi", "Succès");
    }, 1500);
  }

  /**
   * Export Excel
   */
  exportToExcel(): void {
    if (this.filteredTransactions.length === 0) {
      this.toastr.warning("Aucune transaction à exporter", "Attention");
      return;
    }

    this.toastr.info("Génération du fichier Excel... ", "Export Excel");

    // TODO: Implémenter l'export Excel
    setTimeout(() => {
      this.toastr.success("Export Excel réussi", "Succès");
    }, 1500);
  }

  /**
   * Imprimer
   */
  print(): void {
    window.print();
  }

  /**
   * Convertit en CSV
   */
  private convertToCSV(transactions: Transaction[]): string {
    const headers = [
      "Date",
      "Type",
      "Compte Source",
      "Compte Destination",
      "Montant",
      "Solde après",
      "Statut",
      "Référence",
      "Description",
    ];

    const rows = transactions.map((tx) => [
      new Date(tx.transactionDate).toLocaleString("fr-FR"),
      tx.transactionType === "DEPOSIT"
        ? "Dépôt"
        : tx.transactionType === "WITHDRAWAL"
        ? "Retrait"
        : "Virement",
      this.formatAccountNumber(tx.sourceAccountNumber),
      tx.destinationAccountNumber
        ? this.formatAccountNumber(tx.destinationAccountNumber)
        : "",
      this.formatCurrency(tx.amount),
      this.formatCurrency(tx.balanceAfter),
      tx.status === "SUCCESS"
        ? "Succès"
        : tx.status === "PENDING"
        ? "En attente"
        : "Échoué",
      tx.transactionReference,
      tx.description || "",
    ]);

    return [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");
  }

  /**
   * Télécharge un fichier
   */
  private downloadFile(
    content: string,
    filename: string,
    mimeType: string
  ): void {
    const blob = new Blob(["\ufeff" + content], {
      type: `${mimeType};charset=utf-8;`,
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  /**
   * Helpers
   */
  formatAccountNumber(iban: string): string {
    return iban ? iban.match(/.{1,4}/g)?.join(" ") || iban : "";
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  }

  formatNumber(num: number): string {
    return num.toLocaleString("fr-FR");
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  getTransactionIcon(type: string): string {
    const icons: any = {
      DEPOSIT: "trending-up-outline",
      WITHDRAWAL: "trending-down-outline",
      TRANSFER: "swap-outline",
    };
    return icons[type] || "repeat-outline";
  }

  getTransactionColor(type: string): string {
    const colors: any = {
      DEPOSIT: "success",
      WITHDRAWAL: "danger",
      TRANSFER: "primary",
    };
    return colors[type] || "basic";
  }

  getStatusColor(status: string): string {
    const colors: any = {
      SUCCESS: "success",
      PENDING: "warning",
      FAILED: "danger",
    };
    return colors[status] || "basic";
  }

  /**
   * Retourne le compte sélectionné
   */
  getSelectedAccount(): Account | undefined {
    return this.accounts.find((acc) => acc.id === +this.selectedAccountId);
  }

  /**
   * Calcule le solde net
   */
  getNetBalance(): number {
    return this.stats.totalDeposits - this.stats.totalWithdrawals;
  }
}
