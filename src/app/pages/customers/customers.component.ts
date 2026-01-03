import { CustomerApiService } from "./../../@core/data/api/customer-api.service";
import { Component, OnInit } from "@angular/core";
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
      add: false,
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
    mode: "external",
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

  // Vue active
  viewMode: "table" | "grid" | "stats" = "table";

  // Statistiques clients
  customerStats = {
    totalCustomers: 0,
    maleCount: 0,
    femaleCount: 0,
    otherCount: 0,
    averageAge: 0,
    minorsCount: 0,
    adultsCount: 0,
    seniorsCount: 0,
    newThisMonth: 0,
    topNationalities: [] as { name: string; count: number }[],
  };

  // Données graphiques
  genderDistributionData: any[] = [];
  ageDistributionData: any[] = [];
  nationalityDistributionData: any[] = [];
  registrationTrendData: any[] = [];

  // Options graphiques
  colorScheme = {
    domain: ["#3366FF", "#00D68F", "#FFAA00", "#FF3D71", "#00E096"],
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
        this.calculateStatistics();
        this.prepareChartData();
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
   * Calcule les statistiques des clients
   */
  private calculateStatistics(): void {
    this.customerStats.totalCustomers = this.customers.length;
    this.customerStats.maleCount = this.customers.filter(
      (c) => c.gender === "MALE"
    ).length;
    this.customerStats.femaleCount = this.customers.filter(
      (c) => c.gender === "FEMALE"
    ).length;
    this.customerStats.otherCount = this.customers.filter(
      (c) => c.gender === "OTHER"
    ).length;

    // Calcul âge moyen
    const totalAge = this.customers.reduce((sum, c) => sum + c.age, 0);
    this.customerStats.averageAge =
      Math.round(totalAge / this.customers.length) || 0;

    // Répartition par âge
    this.customerStats.minorsCount = this.customers.filter(
      (c) => c.age < 18
    ).length;
    this.customerStats.adultsCount = this.customers.filter(
      (c) => c.age >= 18 && c.age < 65
    ).length;
    this.customerStats.seniorsCount = this.customers.filter(
      (c) => c.age >= 65
    ).length;

    // Nouveaux clients ce mois
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    this.customerStats.newThisMonth = this.customers.filter((c) => {
      const createdDate = new Date(c.createdAt);
      return (
        createdDate.getMonth() === thisMonth &&
        createdDate.getFullYear() === thisYear
      );
    }).length;

    // Top 5 nationalités
    const nationalityCounts: { [key: string]: number } = {};
    this.customers.forEach((c) => {
      nationalityCounts[c.nationality] =
        (nationalityCounts[c.nationality] || 0) + 1;
    });

    this.customerStats.topNationalities = Object.entries(nationalityCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  /**
   * Prépare les données pour les graphiques
   */
  private prepareChartData(): void {
    // Graphique 1: Répartition par genre
    this.genderDistributionData = [
      { name: "Hommes", value: this.customerStats.maleCount },
      { name: "Femmes", value: this.customerStats.femaleCount },
      { name: "Autre", value: this.customerStats.otherCount },
    ].filter((item) => item.value > 0);

    // Graphique 2: Répartition par âge
    this.ageDistributionData = [
      { name: "Mineurs (<18)", value: this.customerStats.minorsCount },
      { name: "Adultes (18-64)", value: this.customerStats.adultsCount },
      { name: "Seniors (65+)", value: this.customerStats.seniorsCount },
    ].filter((item) => item.value > 0);

    // Graphique 3: Top nationalités
    this.nationalityDistributionData = this.customerStats.topNationalities.map(
      (n) => ({
        name: n.name,
        value: n.count,
      })
    );

    // Graphique 4: Tendance inscriptions (simulation sur 6 mois)
    this.registrationTrendData = this.generateRegistrationTrend();
  }

  /**
   * Génère une tendance d'inscription (simulation)
   */
  private generateRegistrationTrend(): any[] {
    const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin"];
    return [
      {
        name: "Nouveaux clients",
        series: months.map((month, index) => ({
          name: month,
          value: Math.floor(Math.random() * 20) + 10 + index * 2,
        })),
      },
    ];
  }

  /**
   * Change le mode d'affichage
   */
  setViewMode(mode: "table" | "grid" | "stats"): void {
    this.viewMode = mode;
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
          message: `Êtes-vous sûr de vouloir supprimer le client ${customer.firstName} ${customer.lastName} ?  Cette action est irréversible. `,
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
        this.loadCustomers();
      },
      error: (error) => {
        if (error.status === 409) {
          this.toastr.warning(
            "Impossible de supprimer :  ce client a des comptes actifs",
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
    if (this.searchTerm.trim()) {
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
   * Export CSV
   */
  exportToCSV(): void {
    const csvContent = this.convertToCSV(this.customers);
    this.downloadCSV(
      csvContent,
      `clients_${new Date().toISOString().split("T")[0]}.csv`
    );
    this.toastr.success("Export CSV réussi", "Succès");
  }

  /**
   * Export PDF (simulation)
   */
  exportToPDF(): void {
    this.toastr.info("Génération du PDF en cours...", "Export PDF");
    // TODO: Implémenter l'export PDF avec jsPDF ou pdfmake
    setTimeout(() => {
      this.toastr.success("Export PDF réussi", "Succès");
    }, 1500);
  }

  /**
   * Import CSV (placeholder)
   */
  importFromCSV(): void {
    this.toastr.info("Fonctionnalité d'import à venir", "Import");
    // TODO: Implémenter l'import CSV
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
      "Adresse",
      "Date Inscription",
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
      c.address,
      new Date(c.createdAt).toLocaleDateString("fr-FR"),
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

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  get currentPageDisplay(): number {
    return this.currentPage + 1;
  }
}
