import { CustomerApiService } from "./../../@core/data/api/customer-api.service";
import { Component, OnInit, ViewChild } from "@angular/core";
import { Router } from "@angular/router";
import { NbDialogService, NbToastrService } from "@nebular/theme";
import { LocalDataSource } from "ng2-smart-table";
import {
  Customer,
  PaginationParams,
  Page,
} from "../../@core/data/models/index";
import { ConfirmDialogComponent } from "../../@core/components/confirm-dialog.component";

@Component({
  selector: "ngx-customers",
  templateUrl: "./customers.component.html",
  styleUrls: ["./customers.component.scss"],
})
export class CustomersComponent implements OnInit {
  // Tableau
  settings = {
    actions: {
      columnTitle: "Actions",
      position: "right",
      add: false, // On utilise notre propre bouton
    },
    add: {
      addButtonContent: '<i class="nb-plus"></i>',
      createButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
    },
    edit: {
      editButtonContent: '<i class="nb-edit" title="Modifier"></i>',
      saveButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
    },
    delete: {
      deleteButtonContent: '<i class="nb-trash" title="Supprimer"></i>',
      confirmDelete: true,
    },
    columns: {
      id: {
        title: "ID",
        type: "number",
        width: "80px",
        filter: false,
      },
      lastName: {
        title: "Nom",
        type: "string",
        filter: true,
      },
      firstName: {
        title: "Prénom",
        type: "string",
        filter: true,
      },
      email: {
        title: "Email",
        type: "string",
        filter: true,
      },
      phoneNumber: {
        title: "Téléphone",
        type: "string",
        filter: true,
      },
      dateOfBirth: {
        title: "Date Naissance",
        type: "string",
        valuePrepareFunction: (value: string) => {
          return new Date(value).toLocaleDateString("fr-FR");
        },
        filter: false,
      },
      age: {
        title: "Âge",
        type: "number",
        width: "80px",
        filter: false,
      },
      gender: {
        title: "Genre",
        type: "string",
        valuePrepareFunction: (value: string) => {
          const genders = {
            MALE: "Homme",
            FEMALE: "Femme",
            OTHER: "Autre",
          };
          return genders[value as keyof typeof genders] || value;
        },
        filter: {
          type: "list",
          config: {
            selectText: "Tous",
            list: [
              { value: "MALE", title: "Homme" },
              { value: "FEMALE", title: "Femme" },
              { value: "OTHER", title: "Autre" },
            ],
          },
        },
      },
      nationality: {
        title: "Nationalité",
        type: "string",
        filter: true,
      },
      createdAt: {
        title: "Inscrit le",
        type: "string",
        valuePrepareFunction: (value: string) => {
          return new Date(value).toLocaleDateString("fr-FR");
        },
        filter: false,
      },
    },
    mode: "external", // Important pour personnaliser les actions
    pager: {
      display: true,
      perPage: 10,
    },
    noDataMessage: "Aucun client trouvé",
  };

  // Données
  source = new LocalDataSource();
  customers: Customer[] = [];
  totalItems = 0;
  pageSize = 10;
  currentPage = 0;

  // États
  isLoading = false;
  searchTerm = "";

  // Pour la pagination manuelle
  @ViewChild("customerTable") customerTable: any;

  constructor(
    private customerApi: CustomerApiService,
    private router: Router,
    private dialogService: NbDialogService,
    private toastr: NbToastrService
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  /**
   * Charge la liste des clients
   */
  loadCustomers(): void {
    this.isLoading = true;

    const params: PaginationParams = {
      page: this.currentPage,
      size: this.pageSize,
      sort: "lastName,asc",
    };

    this.customerApi.getCustomers(params).subscribe({
      next: (response: Page<Customer>) => {
        this.customers = response.content;
        this.totalItems = response.totalElements;
        this.source.load(this.customers);
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.toastr.danger("Erreur lors du chargement des clients", "Erreur");
        console.error("Erreur chargement clients:", error);
      },
    });
  }

  /**
   * Création d'un nouveau client
   */
  onCreate(): void {
    this.router.navigate(["/pages/customers/new"]);
  }

  /**
   * Édition d'un client
   */
  onEdit(event: any): void {
    const customer = event.data as Customer;
    this.router.navigate(["/pages/customers/edit", customer.id]);
  }

  /**
   * Voir les détails d'un client
   */
  onView(event: any): void {
    const customer = event.data as Customer;
    this.router.navigate(["/pages/customers/detail", customer.id]);
  }

  /**
   * Suppression d'un client
   */
  onDelete(event: any): void {
    const customer = event.data as Customer;

    this.dialogService
      .open(ConfirmDialogComponent, {
        context: {
          title: "Confirmer la suppression",
          message: `Êtes-vous sûr de vouloir supprimer le client ${customer.firstName} ${customer.lastName} ? Cette action est irréversible.`,
          confirmText: "Supprimer",
          cancelText: "Annuler",
          status: "danger",
        },
      })
      .onClose.subscribe((confirmed) => {
        if (confirmed) {
          this.deleteCustomer(customer.id);
        }
      });
  }

  /**
   * Supprime un client
   */
  private deleteCustomer(id: number): void {
    this.customerApi.deleteCustomer(id).subscribe({
      next: () => {
        this.toastr.success("Client supprimé avec succès", "Succès");
        this.loadCustomers(); // Recharge la liste
      },
      error: (error) => {
        if (error.status === 409) {
          this.toastr.warning(
            "Impossible de supprimer : ce client a des comptes actifs",
            "Attention"
          );
        } else {
          this.toastr.danger("Erreur lors de la suppression", "Erreur");
        }
      },
    });
  }

  /**
   * Recherche de clients
   */
  onSearch(): void {
    // TODO: Implémenter la recherche côté backend si disponible
    if (this.searchTerm.trim()) {
      // Filtrage local en attendant l'API
      const filtered = this.customers.filter(
        (customer) =>
          customer.lastName
            .toLowerCase()
            .includes(this.searchTerm.toLowerCase()) ||
          customer.firstName
            .toLowerCase()
            .includes(this.searchTerm.toLowerCase()) ||
          customer.email.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
      this.source.load(filtered);
    } else {
      this.source.load(this.customers);
    }
  }

  /**
   * Réinitialise la recherche
   */
  clearSearch(): void {
    this.searchTerm = "";
    this.source.load(this.customers);
  }

  /**
   * Gestion de la pagination
   */
  onPageChange(page: number): void {
    this.currentPage = page - 1; // ng2-smart-table utilise 1-based, notre API 0-based
    this.loadCustomers();
  }

  /**
   * Export CSV
   */
  exportToCSV(): void {
    const csvContent = this.convertToCSV(this.customers);
    this.downloadCSV(csvContent, "clients.csv");
  }

  private convertToCSV(customers: Customer[]): string {
    const headers = [
      "ID",
      "Nom",
      "Prénom",
      "Email",
      "Téléphone",
      "Date Naissance",
      "Âge",
      "Genre",
      "Nationalité",
    ];
    const rows = customers.map((c) => [
      c.id,
      c.lastName,
      c.firstName,
      c.email,
      c.phoneNumber,
      new Date(c.dateOfBirth).toLocaleDateString("fr-FR"),
      c.age,
      c.gender === "MALE" ? "Homme" : c.gender === "FEMALE" ? "Femme" : "Autre",
      c.nationality,
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

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  get currentPageDisplay(): number {
    return this.currentPage + 1;
  }

  /**
   * Navigation pagination
   */
  goToFirstPage(): void {
    this.currentPage = 0;
    this.loadCustomers();
  }

  goToPreviousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadCustomers();
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadCustomers();
    }
  }

  goToLastPage(): void {
    this.currentPage = this.totalPages - 1;
    this.loadCustomers();
  }
}
