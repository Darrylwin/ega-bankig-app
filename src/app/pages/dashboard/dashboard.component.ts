import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { DashboardApiService } from '../../@core/data/api/index';
import { DashboardStats } from '../../@core/data/models/index';
import { NbToastrService } from '@nebular/theme';
import { Subject, interval } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'ngx-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Données du dashboard
  stats:  DashboardStats | null = null;

  // États
  isLoading = true;
  hasError = false;
  errorMessage = '';

  // Auto-refresh
  autoRefreshEnabled = false;
  autoRefreshInterval = 60000; // 1 minute
  lastUpdateTime:  Date = new Date();

  // Graphiques - Options
  colorScheme = {
    domain: ['#3366FF', '#00D68F', '#FFAA00', '#FF3D71', '#0095FF', '#A366FF'],
  };
  showXAxis = true;
  showYAxis = true;
  gradient = false;
  showLegend = true;
  showXAxisLabel = false;
  showYAxisLabel = false;
  animations = true;

  // Données des graphiques
  accountDistributionData: any[] = [];
  transactionsByPeriodData: any[] = [];
  depositsVsWithdrawalsData: any[] = [];

  constructor(
    private dashboardApi: DashboardApiService,
    private toastr: NbToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$. next();
    this.destroy$. complete();
  }

  /**
   * Active/désactive le rafraîchissement automatique
   */
  toggleAutoRefresh(): void {
    this.autoRefreshEnabled = !this.autoRefreshEnabled;
    
    if (this.autoRefreshEnabled) {
      this.setupAutoRefresh();
      this.toastr.success('Rafraîchissement automatique activé', 'Succès');
    } else {
      this.toastr.info('Rafraîchissement automatique désactivé', 'Info');
    }
  }

  /**
   * Configure le rafraîchissement automatique
   */
  private setupAutoRefresh(): void {
    interval(this.autoRefreshInterval)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.autoRefreshEnabled) {
          this.loadDashboardData(true);
        }
      });
  }

  /**
   * Charge les données du dashboard
   */
  loadDashboardData(silent = false): void {
    if (! silent) {
      this.isLoading = true;
    }
    this.hasError = false;

    this.dashboardApi
      .getStats()
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          this.hasError = true;
          this. errorMessage = 'Impossible de charger les statistiques';
          console.error('Erreur dashboard:', error);
          
          if (!silent) {
            this.toastr.danger('Erreur lors du chargement des données', 'Erreur');
          }
          
          return of(null);
        }),
        finalize(() => {
          if (!silent) {
            this. isLoading = false;
          }
          this.lastUpdateTime = new Date();
        })
      )
      .subscribe({
        next: (data) => {
          if (data) {
            this.stats = data;
            this.prepareChartData();
            
            if (!silent) {
              this. toastr.success('Données actualisées', 'Succès');
            }
          }
        },
      });
  }

  /**
   * Prépare les données pour les graphiques
   */
  private prepareChartData(): void {
    if (!this.stats) return;

    // Répartition des comptes
    this.accountDistributionData = [
      {
        name: 'Comptes Courants',
        value: this. stats.currentAccountsCount,
      },
      {
        name:  'Comptes Épargne',
        value: this. stats.savingsAccountsCount,
      },
    ];

    // Transactions par période
    this.transactionsByPeriodData = [
      { name: "Aujourd'hui", value: this.stats.transactionsToday },
      { name: 'Cette semaine', value: this.stats.transactionsThisWeek },
      { name:  'Ce mois', value: this.stats.transactionsThisMonth },
    ];

    // Dépôts vs Retraits
    this.depositsVsWithdrawalsData = [
      {
        name: 'Dépôts',
        series: [
          { name: "Aujourd'hui", value: this.stats.depositsToday },
          { name: 'Semaine', value: this.stats. depositsThisWeek },
          { name: 'Mois', value: this.stats.depositsThisMonth },
        ],
      },
      {
        name:  'Retraits',
        series: [
          { name: "Aujourd'hui", value: this.stats.withdrawalsToday },
          { name: 'Semaine', value: this.stats.withdrawalsThisWeek },
          { name: 'Mois', value: this.stats.withdrawalsThisMonth },
        ],
      },
    ];
  }

  /**
   * Navigation
   */
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  /**
   * Formatage des nombres
   */
  formatNumber(num: number): string {
    return num?. toLocaleString('fr-FR') || '0';
  }

  /**
   * Formatage des montants
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  }

  /**
   * Calcul de pourcentage
   */
  calculatePercentage(part: number, total: number): number {
    return total > 0 ? Math.round((part / total) * 100) : 0;
  }

  /**
   * Temps depuis la dernière mise à jour
   */
  getTimeSinceLastUpdate(): string {
    const now = new Date();
    const diff = now.getTime() - this.lastUpdateTime.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return "À l'instant";
    if (minutes === 1) return 'Il y a 1 minute';
    return `Il y a ${minutes} minutes`;
  }
}