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
          // Format: FR76 3000 4000 0500 1234 5678 901
          return value.replace(/(.{4})/g, "$1 ").trim();
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
            "Impossible de supprimer : compte avec solde non nul",
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
    this.downloadCSV(csvContent, "comptes.csv");
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
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
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
   * Réinitialise les filtres
   */
  resetFilters(): void {
    this.searchTerm = "";
    this.accountTypeFilter = "ALL";
    this.statusFilter = "ALL";
    this.applyFilters();
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  get currentPageDisplay(): number {
    return this.currentPage + 1;
  }
}
