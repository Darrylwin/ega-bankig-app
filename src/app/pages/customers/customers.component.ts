import { Component, OnInit, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { NbDialogService, NbToastrService } from "@nebular/theme";
import { LocalDataSource } from "ng2-smart-table";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import {
  Customer,
  PaginationParams,
  Page,
} from "../../@core/data/models/index";
import { CustomerApiService } from "../../@core/data/api/index";
import { ConfirmDialogComponent } from "../../@core/components/confirm-dialog.component";

@Component({
  selector: "ngx-customers",
  templateUrl: "./customers.component.html",
  styleUrls: ["./customers.component.scss"],
})
export class CustomersComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Données
  customers: Customer[] = [];
  totalItems = 0;
  pageSize = 10;
  currentPage = 0;

  // États
  isLoading = false;
  searchTerm = "";

  // Vue active
  viewMode: "table" | "cards" = "table";

  // Configuration du tableau
  source = new LocalDataSource();
  settings = {
    actions: {
      columnTitle: "Actions",
      position: "right",
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
      id: {
        title: "ID",
        type: "number",
        width: "80px",
        filter: false,
      },
      fullName: {
        title: "Nom complet",
        type: "string",
        filter: false,
        valuePrepareFunction: (value: any, row: Customer) => {
          return `${row.lastName} ${row.firstName}`;
        },
      },
      email: {
        title: "Email",
        type: "string",
        filter: false,
      },
      phoneNumber: {
        title: "Téléphone",
        type: "string",
        filter: false,
      },
      age: {
        title: "Âge",
        type: "html",
        width: "100px",
        filter: false,
        valuePrepareFunction: (value: number) => {
          const color =
            value < 18 ? "warning" : value >= 65 ? "info" : "success";
          return `<span class="badge badge-${color}">${value} ans</span>`;
        },
      },
      gender: {
        title: "Genre",
        type: "html",
        width: "100px",
        filter: false,
        valuePrepareFunction: (value: string) => {
          const genderMap: any = {
            MALE: '<span class="badge badge-primary">Homme</span>',
            FEMALE: '<span class="badge badge-success">Femme</span>',
            OTHER: '<span class="badge badge-basic">Autre</span>',
          };
          return genderMap[value] || value;
        },
      },
      nationality: {
        title: "Nationalité",
        type: "string",
        filter: false,
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
    mode: "external",
    pager: {
      display: false,
    },
    noDataMessage: "Aucun client trouvé",
  };

  constructor(
    private customerApi: CustomerApiService,
    private router: Router,
    private dialogService: NbDialogService,
    private toastr: NbToastrService
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

    this.customerApi
      .getCustomers(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: Page<Customer>) => {
          this.customers = response.content;
          this.totalItems = response.totalElements;
          this.applyFilters();
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          this.toastr.danger("Erreur lors du chargement des clients", "Erreur");
          console.error(error);
        },
      });
  }

  /**
   * Applique les filtres
   */
  applyFilters(): void {
    let filtered = [...this.customers];

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (customer) =>
          customer.lastName.toLowerCase().includes(term) ||
          customer.firstName.toLowerCase().includes(term) ||
          customer.email.toLowerCase().includes(term) ||
          customer.phoneNumber.includes(term)
      );
    }

    this.source.load(filtered);
  }

  /**
   * Recherche de clients
   */
  onSearch(): void {
    this.applyFilters();
  }

  /**
   * Réinitialise la recherche
   */
  clearSearch(): void {
    this.searchTerm = "";
    this.applyFilters();
  }

  /**
   * Change le mode d'affichage
   */
  setViewMode(mode: "table" | "cards"): void {
    this.viewMode = mode;
  }

  /**
   * Navigation vers la création
   */
  onCreate(): void {
    this.router.navigate(["/pages/customers/new"]);
  }

  /**
   * Navigation vers l'édition
   */
  onEdit(event: any): void {
    const customer = event.data as Customer;
    this.router.navigate(["/pages/customers/edit", customer.id]);
  }

  /**
   * Navigation vers les détails
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
          message: `Êtes-vous sûr de vouloir supprimer <strong>${customer.firstName} ${customer.lastName}</strong> ? <br><br><small class="text-muted">Email: ${customer.email}</small><br><small class="text-danger">Cette action est irréversible.</small>`,
          confirmText: "Supprimer",
          cancelText: "Annuler",
          status: "danger",
        },
      })
      .onClose.pipe(takeUntil(this.destroy$))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.deleteCustomer(customer.id);
        }
      });
  }

  /**
   * Supprime un client
   */
  private deleteCustomer(id: number): void {
    this.customerApi
      .deleteCustomer(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastr.success("Client supprimé avec succès", "Succès");
          this.loadCustomers();
        },
        error: (error) => {
          if (error.status === 409) {
            this.toastr.warning(
              "Impossible de supprimer un client avec des comptes actifs",
              "Attention"
            );
          } else {
            this.toastr.danger("Erreur lors de la suppression", "Erreur");
          }
        },
      });
  }

  /**
   * Pagination
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

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  get currentPageDisplay(): number {
    return this.currentPage + 1;
  }

  /**
   * Helpers
   */
  formatNumber(num: number): string {
    return num?.toLocaleString("fr-FR") || "0";
  }

  getGenderLabel(gender: string): string {
    const labels: any = {
      MALE: "Homme",
      FEMALE: "Femme",
      OTHER: "Autre",
    };
    return labels[gender] || gender;
  }

  getAgeCategory(age: number): string {
    if (age < 18) return "Mineur";
    if (age >= 65) return "Senior";
    return "Adulte";
  }

  getAgeCategoryStatus(age: number): string {
    if (age < 18) return "warning";
    if (age >= 65) return "info";
    return "success";
  }
}
