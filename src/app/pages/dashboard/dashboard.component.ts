import { Component, OnInit } from '@angular/core';
import { DashboardApiService, DashboardStats } from '../../../@core/data/api';
import { NbToastrService } from '@nebular/theme';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'ngx-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  // Données
  stats: DashboardStats | null = null;
  
  // États
  isLoading = true;
  hasError = false;
  errorMessage = '';
  
  // Filtres (pour plus tard)
  timeRange: 'today' | 'week' | 'month' = 'today';
  
  // Données pour les graphiques
  chartData: any[] = [];
  
  constructor(
    private dashboardApi: DashboardApiService,
    private toastr: NbToastrService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  /**
   * Charge les données du dashboard
   */
  loadDashboardData(): void {
    this.isLoading = true;
    this.hasError = false;
    
    this.dashboardApi.getStats()
      .pipe(
        catchError(error => {
          this.hasError = true;
          this.errorMessage = 'Impossible de charger les statistiques';
          console.error('Erreur dashboard:', error);
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (data) => {
          if (data) {
            this.stats = data;
            this.prepareChartData();
            this.toastr.success('Données actualisées', 'Succès');
          }
        }
      });
  }

  /**
   * Prépare les données pour les graphiques
   */
  private prepareChartData(): void {
    if (!this.stats) return;

    // Graphique 1 : Répartition des comptes
    this.chartData = [
      {
        name: 'Comptes Courants',
        value: this.stats.currentAccountsCount,
        color: '#36f'
      },
      {
        name: 'Comptes Épargne',
        value: this.stats.savingsAccountsCount,
        color: '#0f0'
      }
    ];
  }

  /**
   * Formate les grands nombres avec séparateurs
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
      minimumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Calcule le pourcentage
   */
  calculatePercentage(part: number, total: number): number {
    return total > 0 ? Math.round((part / total) * 100) : 0;
  }

  /**
   * Retourne l'icône selon le type de transaction
   */
  getTransactionIcon(type: 'deposits' | 'withdrawals'): string {
    return type === 'deposits' ? 'trending-up-outline' : 'trending-down-outline';
  }

  /**
   * Retourne la couleur selon le type
   */
  getTransactionColor(type: 'deposits' | 'withdrawals'): string {
    return type === 'deposits' ? 'success' : 'danger';
  }
}