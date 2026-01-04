import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NbDialogService, NbToastrService } from '@nebular/theme';
import { LocalDataSource } from 'ng2-smart-table';
import {
  Customer,
  PaginationParams,
  Page,
} from '../../@core/data/models/index';
import { CustomerApiService } from '../../@core/data/api/index';
import { ConfirmDialogComponent } from '../../@core/components/confirm-dialog.component';

@Component({
  selector: 'ngx-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss'],
})
export class CustomersComponent implements OnInit {
  // Données
  customers: Customer[] = [];
  totalItems = 0;
  pageSize = 10;
  currentPage = 0;

  // États
  isLoading = false;
  searchTerm = '';

  // Vue active
  viewMode:  'table' | 'cards' | 'stats' = 'table';

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
    newThisWeek: 0,
    topNationalities: [] as { name: string; count: number }[],
    youngestCustomer: null as Customer | null,
    oldestCustomer: null as Customer | null,
  };

  // Données graphiques
  genderDistributionData:  any[] = [];
  ageDistributionData: any[] = [];
  nationalityDistributionData: any[] = [];
  registrationTrendData: any[] = [];

  // Options graphiques
  colorScheme = {
    domain: ['#3366FF', '#00D68F', '#FFAA00', '#FF3D71', '#00E096', '#A366FF'],
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
      editButtonContent: '<i class="nb-edit"></i>',
    },
    delete: {
      deleteButtonContent: '<i class="nb-trash"></i>',
      confirmDelete: true,
    },
    columns: {
      id: {
        title: 'ID',
        type: 'number',
        width: '80px',
        filter: false,
      },
      fullName: {
        title: 'Nom complet',
        type: 'string',
        filter: false,
        valuePrepareFunction: (value:  any, row: Customer) => {
          return `${row.lastName} ${row.firstName}`;
        },
      },
      email: {
        title: 'Email',
        type: 'string',
        filter: false,
      },
      phoneNumber: {
        title: 'Téléphone',
        type: 'string',
        filter: false,
      },
      age: {
        title: 'Âge',
        type:  'html',
        width: '80px',
        filter: false,
        valuePrepareFunction: (value: number) => {
          const color = value < 18 ? 'warning' : value >= 65 ? 'info' : 'success';
          return `<span class="badge badge-${color}">${value} ans</span>`;
        },
      },
      gender: {
        title: 'Genre',
        type: 'html',
        filter: false,
        valuePrepareFunction: (value: string) => {
          const genderMap:  any = {
            MALE: '<span class="badge badge-primary"><i class="nb-person"></i> H</span>',
            FEMALE: '<span class="badge badge-success"><i class="nb-person"></i> F</span>',
            OTHER: '<span class="badge badge-basic"><i class="nb-person"></i> A</span>',
          };
          return genderMap[value] || value;
        },
      },
      nationality: {
        title:  'Nationalité',
        type: 'string',
        filter: false,
      },
      createdAt:  {
        title: 'Inscrit le',
        type: 'string',
        valuePrepareFunction: (value:  string) => {
          return new Date(value).toLocaleDateString('fr-FR');
        },
        filter: false,
      },
    },
    mode: 'external',
    pager: {
      display: false,
    },
    noDataMessage: 'Aucun client trouvé',
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

    const params:  PaginationParams = {
      page: this.currentPage,
      size: this.pageSize,
      sort: 'lastName,asc',
    };

    this.customerApi.getCustomers(params).subscribe({
      next: (response:  Page<Customer>) => {
        this.customers = response.content;
        this.totalItems = response.totalElements;
        this.applyFilters();
        this.calculateStatistics();
        this.prepareChartData();
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.toastr.danger('Erreur lors du chargement des clients', 'Erreur');
        console.error(error);
      },
    });
  }

  /**
   * Calcule les statistiques des clients
   */
  private calculateStatistics(): void {
    this.customerStats.totalCustomers = this.customers.length;
    this.customerStats.maleCount = this.customers.filter((c) => c.gender === 'MALE').length;
    this.customerStats.femaleCount = this.customers.filter((c) => c.gender === 'FEMALE').length;
    this.customerStats.otherCount = this.customers.filter((c) => c.gender === 'OTHER').length;

    // Calcul âge moyen
    const totalAge = this.customers.reduce((sum, c) => sum + c.age, 0);
    this.customerStats.averageAge = Math.round(totalAge / this.customers.length) || 0;

    // Répartition par âge
    this.customerStats. minorsCount = this.customers. filter((c) => c.age < 18).length;
    this.customerStats.adultsCount = this.customers.filter((c) => c.age >= 18 && c.age < 65).length;
    this.customerStats.seniorsCount = this.customers.filter((c) => c.age >= 65).length;

    // Clients les plus jeune/âgé
    if (this.customers.length > 0) {
      const sorted = [... this.customers].sort((a, b) => a.age - b.age);
      this.customerStats.youngestCustomer = sorted[0];
      this.customerStats.oldestCustomer = sorted[sorted.length - 1];
    }

    // Nouveaux clients
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    this.customerStats.newThisMonth = this.customers.filter((c) => {
      const createdDate = new Date(c. createdAt);
      return createdDate.getMonth() === thisMonth && createdDate.getFullYear() === thisYear;
    }).length;

    this.customerStats.newThisWeek = this.customers.filter((c) => {
      const createdDate = new Date(c.createdAt);
      return createdDate >= oneWeekAgo;
    }).length;

    // Top nationalités
    const nationalityCounts:  { [key: string]: number } = {};
    this.customers.forEach((c) => {
      nationalityCounts[c.nationality] = (nationalityCounts[c.nationality] || 0) + 1;
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
    // 1. Répartition par genre
    this.genderDistributionData = [
      { name: 'Hommes', value: this.customerStats.maleCount },
      { name: 'Femmes', value: this.customerStats.femaleCount },
      { name:  'Autre', value: this.customerStats. otherCount },
    ].filter((item) => item.value > 0);

    // 2. Répartition par âge
    this.ageDistributionData = [
      { name: 'Mineurs (<18)', value: this.customerStats.minorsCount },
      { name: 'Adultes (18-64)', value: this.customerStats.adultsCount },
      { name: 'Seniors (65+)', value: this.customerStats.seniorsCount },
    ].filter((item) => item.value > 0);

    // 3. Top nationalités
    this.nationalityDistributionData = this.customerStats.topNationalities.map((n) => ({
      name: n.name,
      value: n.count,
    }));

    // 4. Tendance inscriptions (6 derniers mois)
    this.registrationTrendData = this.generateRegistrationTrend();
  }

  /**
   * Génère une tendance d'inscription
   */
  private generateRegistrationTrend(): any[] {
    const monthlyData:  { [key: string]: number } = {};
    const now = new Date();

    // Initialiser les 6 derniers mois
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now. getFullYear(), now.getMonth() - i, 1);
      const key = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
      monthlyData[key] = 0;
    }

    // Compter les inscriptions par mois
    this.customers.forEach((customer) => {
      const date = new Date(customer.createdAt);
      const key = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
      if (monthlyData. hasOwnProperty(key)) {
        monthlyData[key]++;
      }
    });

    return [
      {
        name: 'Nouveaux clients',
        series: Object.entries(monthlyData).map(([name, value]) => ({ name, value })),
      },
    ];
  }

  /**
   * Applique les filtres
   */
  applyFilters(): void {
    let filtered = [... this.customers];

    if (this.searchTerm. trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (customer) =>
          customer.lastName.toLowerCase().includes(term) ||
          customer.firstName.toLowerCase().includes(term) ||
          customer.email.toLowerCase().includes(term) ||
          customer.phoneNumber. includes(term)
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
    this.searchTerm = '';
    this.applyFilters();
  }

  /**
   * Change le mode d'affichage
   */
  setViewMode(mode: 'table' | 'cards' | 'stats'): void {
    this.viewMode = mode;
  }

  /**
   * Navigation vers la création
   */
  onCreate(): void {
    this.router.navigate(['/pages/customers/new']);
  }

  /**
   * Navigation vers l'édition
   */
  onEdit(event: any): void {
    const customer = event.data as Customer;
    this.router. navigate(['/pages/customers/edit', customer.id]);
  }

  /**
   * Navigation vers les détails
   */
  onView(event: any): void {
    const customer = event.data as Customer;
    this.router. navigate(['/pages/customers/detail', customer.id]);
  }

  /**
   * Suppression d'un client
   */
  onDelete(event: any): void {
    const customer = event. data as Customer;

    this.dialogService
      .open(ConfirmDialogComponent, {
        context: {
          title: 'Confirmer la suppression',
          message: `Êtes-vous sûr de vouloir supprimer <strong>${customer.firstName} ${customer.lastName}</strong> ? <br><br><small class="text-muted">Email: ${customer.email}</small><br><small class="text-danger">Cette action est irréversible.</small>`,
          confirmText: 'Supprimer',
          cancelText: 'Annuler',
          status: 'danger',
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
        this.toastr.success('Client supprimé avec succès', 'Succès');
        this.loadCustomers();
      },
      error:  (error) => {
        if (error.status === 409) {
          this.toastr.warning('Impossible de supprimer un client avec des comptes actifs', 'Attention');
        } else {
          this.toastr.danger('Erreur lors de la suppression', 'Erreur');
        }
      },
    });
  }

  /**
   * Export CSV
   */
  exportToCSV(): void {
    const headers = ['ID', 'Nom', 'Prénom', 'Email', 'Téléphone', 'Date Naissance', 'Âge', 'Genre', 'Nationalité', 'Adresse', 'Date Inscription'];
    const rows = this.customers.map((c) => [
      c.id. toString(),
      c.lastName,
      c.firstName,
      c.email,
      c. phoneNumber,
      new Date(c.dateOfBirth).toLocaleDateString('fr-FR'),
      c.age. toString(),
      c.gender === 'MALE' ? 'Homme' : c.gender === 'FEMALE' ? 'Femme' :  'Autre',
      c.nationality,
      c.address,
      new Date(c. createdAt).toLocaleDateString('fr-FR'),
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `clients_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    this.toastr.success('Export CSV réussi', 'Succès');
  }

  /**
   * Export PDF (simulation)
   */
  exportToPDF(): void {
    this.toastr.info('Génération du PDF en cours...', 'Export PDF');
    setTimeout(() => {
      this.toastr.success('Export PDF réussi', 'Succès');
    }, 1500);
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
    return num.toLocaleString('fr-FR');
  }

  calculatePercentage(part: number, total: number): number {
    return total > 0 ? Math.round((part / total) * 100) : 0;
  }

  getGenderLabel(gender: string): string {
    const labels:  any = {
      MALE: 'Homme',
      FEMALE: 'Femme',
      OTHER: 'Autre',
    };
    return labels[gender] || gender;
  }
}