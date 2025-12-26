import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { NbToastrService } from "@nebular/theme";
import { LocalDataSource } from "ng2-smart-table";
import {
  TransactionApiService,
  AccountApiService,
} from "../../../@core/data/api/index";
import { Transaction, Account } from "../../../@core/data/models/index";
import { url } from "inspector";

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
    },
    columns: {
      transactionDate: {
        title: "Date & Heure",
        type: "string",
        valuePrepareFunction: (value: string) => {
          return new Date(value).toLocaleString("fr-FR");
        },
        filter: false,
      },
      transactionType: {
        title: "Type",
        type: "html",
        valuePrepareFunction: (value: string) => {
          const types: any = {
            DEPOSIT: '<span class="badge badge-success">Dépôt</span>',
            WITHDRAWAL: '<span class="badge badge-danger">Retrait</span>',
            TRANSFER: '<span class="badge badge-primary">Virement</span>',
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
      },
      sourceAccountNumber: {
        title: "Compte Source",
        type: "string",
        valuePrepareFunction: (value: string) => {
          return value ? this.formatAccountNumber(value) : "—";
        },
        filter: true,
      },
      destinationAccountNumber: {
        title: "Compte Destination",
        type: "string",
        valuePrepareFunction: (value: string) => {
          return value ? this.formatAccountNumber(value) : "—";
        },
        filter: true,
      },
      amount: {
        title: "Montant",
        type: "number",
        valuePrepareFunction: (value: number, row: Transaction) => {
          const formatted = this.formatCurrency(Math.abs(value));
          const color =
            row.transactionType === "DEPOSIT" ? "text-success" : "text-danger";
          return `<span class="${color} fw-bold">${formatted}</span>`;
        },
        filter: false,
      },
      balanceAfter: {
        title: "Solde après",
        type: "number",
        valuePrepareFunction: (value: number) => {
          return this.formatCurrency(value);
        },
        filter: false,
      },
      status: {
        title: "Statut",
        type: "html",
        valuePrepareFunction: (value: string) => {
          const statusMap: any = {
            PENDING: '<span class="badge badge-warning">En attente</span>',
            SUCCESS: '<span class="badge badge-success">Succès</span>',
            FAILED: '<span class="badge badge-danger">Échoué</span>',
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
      },
      description: {
        title: "Description",
        type: "string",
        filter: true,
      },
    },
    pager: {
      display: true,
      perPage: 10,
    },
    noDataMessage: "Aucune transaction trouvée",
  };

  // Données
  source = new LocalDataSource();
  transactions: Transaction[] = [];
  accounts: Account[] = [];

  // Filtres
  selectedAccountId: string = "ALL";
  selectedType: string = "ALL";
  startDate: string = "";
  endDate: string = "";
  searchTerm: string = "";

  // États
  isLoading = false;
  accountIdFromRoute: number | null = null;

  // Options
  filterOptions = {
    accountTypes: [
      { value: "ALL", label: "Tous les types" },
      { value: "DEPOSIT", label: "Dépôt" },
      { value: "WITHDRAWAL", label: "Retrait" },
      { value: "TRANSFER", label: "Virement" },
    ],
    statuses: [
      { value: "ALL", label: "Tous les statuts" },
      { value: "SUCCESS", label: "Succès" },
      { value: "PENDING", label: "En attente" },
      { value: "FAILED", label: "Échoué" },
    ],
  };

  // Propriété pour la date d'aujourd'hui
  today = new Date();

  // Propriétés pour les labels du stepper (si tu utilises un stepper)
  step1Label = "Comptes";
  step2Label = "Montant";
  step3Label = "Confirmation";

  constructor(
    private route: ActivatedRoute,
    private transactionApi: TransactionApiService,
    private accountApi: AccountApiService,
    private toastr: NbToastrService
  ) {}

  ngOnInit(): void {
    // Vérifie si un accountId est passé dans l'URL
    const accountId = this.route.snapshot.params["accountId"];
    if (accountId) {
      this.accountIdFromRoute = +accountId;
      this.selectedAccountId = accountId.toString();
    }

    this.loadAccounts();
    this.loadTransactions();
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
        },
        error: (error) => {
          console.error("Erreur chargement comptes:", error);
        },
      });
  }

  /**
   * Charge les transactions
   */
  loadTransactions(): void {
    this.isLoading = true;

    if (this.selectedAccountId !== "ALL" && this.selectedAccountId) {
      // Charger pour un compte spécifique
      const accountId = +this.selectedAccountId;

      if (this.startDate && this.endDate) {
        // Charger avec période
        this.transactionApi
          .getTransactionsByPeriod(accountId, this.startDate, this.endDate)
          .subscribe({
            next: (transactions) => {
              this.transactions = transactions;
              this.applyFilters();
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
        // Charger tout l'historique du compte
        this.transactionApi.getTransactionsByAccount(accountId).subscribe({
          next: (transactions) => {
            this.transactions = transactions;
            this.applyFilters();
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
    } else {
      // TODO: Si tu as un endpoint pour toutes les transactions
      this.isLoading = false;
      this.transactions = [];
      this.source.load([]);
    }
  }

  /**
   * Applique les filtres
   */
  applyFilters(): void {
    let filtered = this.transactions;

    // Filtre par type
    if (this.selectedType !== "ALL") {
      filtered = filtered.filter(
        (tx) => tx.transactionType === this.selectedType
      );
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

    // Trier par date (récent en premier)
    filtered.sort(
      (a, b) =>
        new Date(b.transactionDate).getTime() -
        new Date(a.transactionDate).getTime()
    );

    this.source.load(filtered);
  }

  /**
   * Réinitialise les filtres
   */
  resetFilters(): void {
    this.selectedAccountId = this.accountIdFromRoute
      ? this.accountIdFromRoute.toString()
      : "ALL";
    this.selectedType = "ALL";
    this.startDate = "";
    this.endDate = "";
    this.searchTerm = "";
    this.loadTransactions();
  }

  /**
   * Export CSV
   */
  exportToCSV(): void {
    const csvContent = this.convertToCSV(this.transactions);
    this.downloadCSV(csvContent, "transactions.csv");
  }

  private convertToCSV(transactions: Transaction[]): string {
    const headers = [
      "Date",
      "Type",
      "Compte Source",
      "Compte Destination",
      "Montant",
      "Solde après",
      "Statut",
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
      tx.description || "",
    ]);

    return [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");
  }

  private downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(link.href);
  }

  /**
   * Formatte le numéro de compte
   */
  formatAccountNumber(iban: string): string {
    return iban.replace(/(.{4})/g, "$1 ").trim();
  }

  /**
   * Formatte la monnaie
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  }

  /**
   * Retourne le nom du compte
   */
  getAccountName(accountId: number): string {
    const account = this.accounts.find((acc) => acc.id === accountId);
    return account
      ? `${account.customerFullName} (${this.formatAccountNumber(
          account.accountNumber
        )})`
      : `Compte #${accountId}`;
  }

  /**
   * Périodes prédéfinies
   */
  setLast30Days(): void {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    this.startDate = thirtyDaysAgo.toISOString().split("T")[0];
    this.endDate = today.toISOString().split("T")[0];
    this.loadTransactions();
  }

  setCurrentMonth(): void {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    this.startDate = firstDay.toISOString().split("T")[0];
    this.endDate = today.toISOString().split("T")[0];
    this.loadTransactions();
  }

  setLastMonth(): void {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);

    this.startDate = firstDay.toISOString().split("T")[0];
    this.endDate = lastDay.toISOString().split("T")[0];
    this.loadTransactions();
  }

  /**
   * Retourne la date de demain pour la validation
   */
  getTomorrowDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  }
}
