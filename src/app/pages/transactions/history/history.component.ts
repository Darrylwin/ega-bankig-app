import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { NbToastrService } from "@nebular/theme";
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
        filter: false,
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
    private toastr: NbToastrService
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
    // 1. Répartition par type
    this.transactionsByTypeData = [
      { name: "Dépôts", value: this.stats.depositsCount },
      { name: "Retraits", value: this.stats.withdrawalsCount },
      { name: "Virements", value: this.stats.transfersCount },
    ].filter((item) => item.value > 0);

    // 2. Transactions par date (derniers 7 jours)
    const dateMap: { [key: string]: number } = {};
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const key = date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
      });
      dateMap[key] = 0;
      return key;
    });

    this.filteredTransactions.forEach((tx) => {
      const date = new Date(tx.transactionDate);
      const key = date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
      });
      if (dateMap.hasOwnProperty(key)) {
        dateMap[key]++;
      }
    });

    this.transactionsByDateData = Object.entries(dateMap).map(
      ([name, value]) => ({ name, value })
    );
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
    }
  }

  /**
   * Change le mode d'affichage
   */
  setViewMode(mode: "table" | "cards" | "timeline"): void {
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
    this.toastr.info(
      `Référence: ${transaction.transactionReference}`,
      "Détails de la transaction",
      { duration: 5000 }
    );
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

  /**
   * Impression
   */
  print(): void {
    window.print();
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

  formatDate(dateString: string): string {
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

  getNetBalance(): number {
    return this.stats.totalDeposits - this.stats.totalWithdrawals;
  }
}
