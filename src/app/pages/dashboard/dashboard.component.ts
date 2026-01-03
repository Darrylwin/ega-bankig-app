import { Component, OnInit } from "@angular/core";
import { DashboardApiService } from "../../@core/data/api/index";
import { DashboardStats } from "../../@core/data/models/index";
import { NbToastrService } from "@nebular/theme";
import { catchError, finalize } from "rxjs/operators";
import { of } from "rxjs";

@Component({
  selector: "ngx-dashboard",
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.scss"],
})
export class DashboardComponent implements OnInit {
  // Données
  stats: DashboardStats | null = null;

  // États
  isLoading = true;
  hasError = false;
  errorMessage = "";

  // Filtres
  timeRange: "today" | "week" | "month" = "month";

  // === DONNÉES POUR LES GRAPHIQUES ===

  // 1. Graphique en donut :  Répartition des comptes
  accountDistributionData: any[] = [];

  // 2. Graphique en barres : Transactions par période
  transactionsByPeriodData: any[] = [];

  // 3. Graphique en lignes : Évolution du solde
  balanceEvolutionData: any[] = [];

  // 4. Graphique en barres groupées : Dépôts vs Retraits
  depositsVsWithdrawalsData: any[] = [];

  // Options communes pour ngx-charts
  view: [number, number] = [undefined as any, 300];
  colorScheme = {
    domain: ["#3366FF", "#00D68F", "#FFAA00", "#FF3D71", "#00E096"],
  };
  showXAxis = true;
  showYAxis = true;
  gradient = false;
  showLegend = true;
  showXAxisLabel = true;
  showYAxisLabel = true;
  animations = true;

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

    this.dashboardApi
      .getStats()
      .pipe(
        catchError((error) => {
          this.hasError = true;
          this.errorMessage = "Impossible de charger les statistiques";
          console.error("Erreur dashboard:", error);
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
            this.toastr.success("Données actualisées", "Succès");
          }
        },
      });
  }

  /**
   * Prépare toutes les données pour les graphiques
   */
  private prepareChartData(): void {
    if (!this.stats) return;

    // 1. Graphique en donut : Répartition des comptes
    this.accountDistributionData = [
      {
        name: "Comptes Courants",
        value: this.stats.currentAccountsCount,
      },
      {
        name: "Comptes Épargne",
        value: this.stats.savingsAccountsCount,
      },
    ];

    // 2. Graphique en barres : Transactions par période
    this.transactionsByPeriodData = [
      {
        name: "Aujourd'hui",
        value: this.stats.transactionsToday,
      },
      {
        name: "Cette semaine",
        value: this.stats.transactionsThisWeek,
      },
      {
        name: "Ce mois",
        value: this.stats.transactionsThisMonth,
      },
    ];

    // 3. Graphique en lignes : Évolution du solde (simulation)
    this.balanceEvolutionData = [
      {
        name: "Solde Total",
        series: this.generateBalanceEvolution(),
      },
    ];

    // 4. Graphique en barres groupées : Dépôts vs Retraits
    this.depositsVsWithdrawalsData = [
      {
        name: "Dépôts",
        series: [
          { name: "Aujourd'hui", value: this.stats.depositsToday },
          { name: "Cette semaine", value: this.stats.depositsThisWeek },
          { name: "Ce mois", value: this.stats.depositsThisMonth },
        ],
      },
      {
        name: "Retraits",
        series: [
          { name: "Aujourd'hui", value: this.stats.withdrawalsToday },
          { name: "Cette semaine", value: this.stats.withdrawalsThisWeek },
          { name: "Ce mois", value: this.stats.withdrawalsThisMonth },
        ],
      },
    ];
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

      // Simulation :  variation aléatoire entre -5% et +5%
      const variation = (Math.random() - 0.5) * 0.1;
      const balance = baseBalance * (1 + variation);

      evolution.push({
        name: date.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "short",
        }),
        value: Math.round(balance),
      });
    }

    return evolution;
  }

  /**
   * Callback pour les clics sur les graphiques
   */
  onChartSelect(event: any): void {
    console.log("Chart clicked:", event);
  }

  /**
   * Formate les valeurs pour les tooltips
   */
  formatCurrencyForChart = (value: number): string => {
    return this.formatCurrency(value);
  };

  /**
   * Formate les grands nombres avec séparateurs
   */
  formatNumber(num: number): string {
    return num.toLocaleString("fr-FR");
  }

  /**
   * Formate le montant en euros
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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
  getTransactionIcon(type: "deposits" | "withdrawals"): string {
    return type === "deposits"
      ? "trending-up-outline"
      : "trending-down-outline";
  }

  /**
   * Retourne la couleur selon le type
   */
  getTransactionColor(type: "deposits" | "withdrawals"): string {
    return type === "deposits" ? "success" : "danger";
  }

  /**
   * Calcule le taux de croissance
   */
  calculateGrowthRate(): number {
    if (!this.stats) return 0;

    const weeklyAvg = this.stats.transactionsThisWeek / 7;
    const todayCount = this.stats.transactionsToday;

    if (weeklyAvg === 0) return 0;

    return Math.round(((todayCount - weeklyAvg) / weeklyAvg) * 100);
  }

  /**
   * Retourne le statut du taux de croissance
   */
  getGrowthStatus(): "success" | "danger" | "warning" {
    const rate = this.calculateGrowthRate();
    if (rate > 10) return "success";
    if (rate < -10) return "danger";
    return "warning";
  }
}
