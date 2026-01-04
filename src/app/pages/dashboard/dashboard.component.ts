import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { DashboardApiService } from '../../@core/data/api/index';
import { DashboardStats } from '../../@core/data/models/index';
import { NbToastrService } from '@nebular/theme';
import { catchError, finalize } from 'rxjs/operators';
import { of, interval, Subscription } from 'rxjs';

@Component({
  selector:  'ngx-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  // Données
  stats: DashboardStats | null = null;

  // États
  isLoading = true;
  hasError = false;
  errorMessage = '';

  // Filtres
  timeRange: 'today' | 'week' | 'month' = 'month';

  // Auto-refresh
  private autoRefreshSubscription?: Subscription;
  autoRefreshEnabled = true;
  autoRefreshInterval = 60000; // 1 minute
  lastUpdateTime:  Date = new Date();

  // Graphiques - Répartition des comptes
  accountDistributionData: any[] = [];
  accountDistributionView: [number, number] = [undefined as any, 300];

  // Graphiques - Transactions par période
  transactionsByPeriodData: any[] = [];

  // Graphiques - Évolution du solde
  balanceEvolutionData: any[] = [];

  // Graphiques - Dépôts vs Retraits
  depositsVsWithdrawalsData: any[] = [];

  // Graphiques - Transactions par type (aujourd'hui, semaine, mois)
  transactionsByTypeData: any[] = [];

  // Options communes pour ngx-charts
  colorScheme = {
    domain:  ['#3366FF', '#00D68F', '#FFAA00', '#FF3D71', '#0095FF', '#A366FF'],
  };
  showXAxis = true;
  showYAxis = true;
  gradient = true;
  showLegend = true;
  showXAxisLabel = true;
  showYAxisLabel = true;
  animations = true;

  // Labels
  xAxisLabel = 'Période';
  yAxisLabel = 'Montant';

  // Statistiques calculées
  calculatedStats = {
    averageTransactionValue: 0,
    accountsPerCustomer: 0,
    growthRate: 0,
    transactionSuccessRate: 100,
    topTransactionType: '',
    balanceChangePercent: 0,
  };

  constructor(
    private dashboardApi: DashboardApiService,
    private toastr: NbToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.setupAutoRefresh();
  }

  ngOnDestroy(): void {
    if (this.autoRefreshSubscription) {
      this.autoRefreshSubscription.unsubscribe();
    }
  }

  /**
   * Configure le rafraîchissement automatique
   */
  private setupAutoRefresh(): void {
    if (this.autoRefreshEnabled) {
      this.autoRefreshSubscription = interval(this.autoRefreshInterval).subscribe(() => {
        this.loadDashboardData(true); // true = silent refresh
      });
    }
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
      if (this.autoRefreshSubscription) {
        this.autoRefreshSubscription.unsubscribe();
      }
      this.toastr.info('Rafraîchissement automatique désactivé', 'Info');
    }
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
        catchError((error) => {
          this.hasError = true;
          this.errorMessage = 'Impossible de charger les statistiques du tableau de bord';
          console. error('Erreur dashboard:', error);
          
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
            this.calculateDerivedStats();
            this.prepareChartData();
            
            if (!silent) {
              this.toastr.success('Données actualisées avec succès', 'Succès');
            }
          }
        },
      });
  }

  /**
   * Calcule des statistiques dérivées
   */
  private calculateDerivedStats(): void {
    if (!this.stats) return;

    // Valeur moyenne des transactions
    this.calculatedStats.averageTransactionValue =
      this.stats.totalTransactions > 0
        ? (this.stats.depositsThisMonth + this.stats.withdrawalsThisMonth) /
          this.stats.totalTransactions
        : 0;

    // Comptes par client
    this.calculatedStats. accountsPerCustomer =
      this.stats.totalCustomers > 0
        ? this.stats.totalAccounts / this.stats.totalCustomers
        : 0;

    // Taux de croissance (semaine vs mois)
    const weeklyAverage = this.stats.transactionsThisWeek / 7;
    const monthlyAverage = this.stats.transactionsThisMonth / 30;
    
    this.calculatedStats.growthRate =
      monthlyAverage > 0
        ? ((weeklyAverage - monthlyAverage) / monthlyAverage) * 100
        : 0;

    // Type de transaction le plus fréquent
    const deposits = this.stats.depositsThisMonth;
    const withdrawals = this.stats.withdrawalsThisMonth;
    const transfers = this.stats.transactionsThisMonth - (deposits + withdrawals);
    
    const max = Math.max(deposits, withdrawals, transfers);
    
    if (max === deposits) {
      this.calculatedStats.topTransactionType = 'Dépôts';
    } else if (max === withdrawals) {
      this.calculatedStats.topTransactionType = 'Retraits';
    } else {
      this. calculatedStats.topTransactionType = 'Virements';
    }

    // Variation du solde (simulation)
    this.calculatedStats.balanceChangePercent = Math.random() * 20 - 10; // -10% à +10%
  }

  /**
   * Prépare toutes les données pour les graphiques
   */
  private prepareChartData(): void {
    if (!this.stats) return;

    // 1. Répartition des comptes (Pie Chart)
    this.accountDistributionData = [
      {
        name: 'Comptes Courants',
        value: this.stats.currentAccountsCount,
        extra: { percentage: this.calculatePercentage(this.stats.currentAccountsCount, this.stats.totalAccounts) }
      },
      {
        name: 'Comptes Épargne',
        value:  this.stats.savingsAccountsCount,
        extra: { percentage: this.calculatePercentage(this.stats.savingsAccountsCount, this.stats.totalAccounts) }
      },
    ];

    // 2. Transactions par période (Bar Chart)
    this.transactionsByPeriodData = [
      { name: "Aujourd'hui", value: this.stats.transactionsToday },
      { name: 'Cette semaine', value: this.stats.transactionsThisWeek },
      { name:  'Ce mois', value:  this.stats.transactionsThisMonth },
    ];

    // 3. Évolution du solde sur 7 jours (Line Chart)
    this.balanceEvolutionData = [
      {
        name: 'Solde Total',
        series: this.generateBalanceEvolution(),
      },
    ];

    // 4. Dépôts vs Retraits (Grouped Bar Chart)
    this.depositsVsWithdrawalsData = [
      {
        name: 'Dépôts',
        series: [
          { name: "Aujourd'hui", value: this.stats.depositsToday },
          { name: 'Semaine', value: this.stats. depositsThisWeek },
          { name: 'Mois', value: this.stats. depositsThisMonth },
        ],
      },
      {
        name: 'Retraits',
        series: [
          { name: "Aujourd'hui", value: this.stats. withdrawalsToday },
          { name: 'Semaine', value: this.stats.withdrawalsThisWeek },
          { name: 'Mois', value: this.stats.withdrawalsThisMonth },
        ],
      },
    ];

    // 5. Transactions par type (Stacked Area Chart)
    this.transactionsByTypeData = this.generateTransactionsByType();
  }

  /**
   * Génère une simulation d'évolution du solde sur 7 jours
   */
  private generateBalanceEvolution(): any[] {
    if (!this.stats) return [];

    const evolution = [];
    const today = new Date();
    const baseBalance = this.stats.totalBalance;

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // Simulation :  variation progressive
      const dayVariation = ((6 - i) / 6) * (this.calculatedStats.balanceChangePercent / 100);
      const balance = baseBalance * (1 - dayVariation);

      evolution.push({
        name: date. toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
        value: Math.round(balance),
      });
    }

    return evolution;
  }

  /**
   * Génère les transactions par type sur plusieurs jours
   */
  private generateTransactionsByType(): any[] {
    if (!this.stats) return [];

    const data = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const dayName = date.toLocaleDateString('fr-FR', { weekday:  'short' });

      // Simulation basée sur les stats réelles
      const factor = (7 - i) / 7; // Augmentation progressive
      
      data.push({
        name: dayName,
        series: [
          {
            name: 'Dépôts',
            value:  Math.round((this.stats.depositsThisWeek / 7) * factor * (0.8 + Math.random() * 0.4)),
          },
          {
            name: 'Retraits',
            value: Math. round((this.stats.withdrawalsThisWeek / 7) * factor * (0.8 + Math.random() * 0.4)),
          },
        ],
      });
    }

    return data;
  }

  /**
   * Navigation vers une section
   */
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  /**
   * Callback pour les clics sur les graphiques
   */
  onChartSelect(event: any): void {
    console.log('Chart clicked:', event);
  }

  /**
   * Formate les nombres avec séparateurs
   */
  formatNumber(num: number): string {
    return num.toLocaleString('fr-FR');
  }

  /**
   * Formate le montant en euros
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Formate pour les tooltips
   */
  formatCurrencyForChart = (value: number): string => {
    return this.formatCurrency(value);
  };

  /**
   * Calcule le pourcentage
   */
  calculatePercentage(part: number, total: number): number {
    return total > 0 ? Math.round((part / total) * 100) : 0;
  }

  /**
   * Retourne l'icône selon le type
   */
  getTransactionIcon(type: 'deposits' | 'withdrawals' | 'transfers'): string {
    const icons = {
      deposits: 'trending-up-outline',
      withdrawals: 'trending-down-outline',
      transfers: 'swap-outline',
    };
    return icons[type];
  }

  /**
   * Retourne la couleur selon le type
   */
  getTransactionColor(type: 'deposits' | 'withdrawals' | 'transfers'): string {
    const colors = {
      deposits: 'success',
      withdrawals: 'danger',
      transfers: 'primary',
    };
    return colors[type];
  }

  /**
   * Retourne le statut du taux de croissance
   */
  getGrowthStatus(): 'success' | 'danger' | 'warning' {
    const rate = this.calculatedStats.growthRate;
    if (rate > 10) return 'success';
    if (rate < -10) return 'danger';
    return 'warning';
  }

  /**
   * Formate le temps écoulé depuis la dernière mise à jour
   */
  getTimeSinceLastUpdate(): string {
    const now = new Date();
    const diff = now.getTime() - this.lastUpdateTime.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return "À l'instant";
    if (minutes === 1) return 'Il y a 1 minute';
    return `Il y a ${minutes} minutes`;
  }

  /**
   * Retourne une couleur selon une valeur
   */
  getValueColor(value: number, threshold: number = 0): string {
    if (value > threshold) return 'success';
    if (value < threshold) return 'danger';
    return 'warning';
  }

  /**
   * Formate un nombre décimal
   */
  formatDecimal(num: number, decimals: number = 2): string {
    return num.toFixed(decimals);
  }
}