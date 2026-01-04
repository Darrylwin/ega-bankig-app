import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import {
  TransactionApiService,
  AccountApiService,
} from "../../@core/data/api/index";

@Component({
  selector: "ngx-transactions",
  templateUrl: "./transactions.component.html",
  styleUrls: ["./transactions.component.scss"],
})
export class TransactionsComponent implements OnInit {
  // Cartes des opérations
  operations = [
    {
      title: "Dépôt",
      description: "Ajouter des fonds",
      subtitle: "Créditer un compte bancaire",
      icon: "trending-up-outline",
      color: "success",
      route: "/pages/transactions/deposit",
      features: [
        "Espèces, chèque, virement",
        "Validation immédiate",
        "Reçu automatique",
        "Sans frais",
      ],
      quickStats: {
        today: 0,
        amount: 0,
      },
    },
    {
      title: "Retrait",
      description: "Retirer des fonds",
      subtitle: "Débiter un compte bancaire",
      icon: "trending-down-outline",
      color: "danger",
      route: "/pages/transactions/withdraw",
      features: [
        "Vérification solde",
        "Limites de sécurité",
        "Pièce d'identité requise",
        "Justificatif obligatoire",
      ],
      quickStats: {
        today: 0,
        amount: 0,
      },
    },
    {
      title: "Virement",
      description: "Transférer des fonds",
      subtitle: "Entre deux comptes",
      icon: "swap-horizontal-outline",
      color: "primary",
      route: "/pages/transactions/transfer",
      features: [
        "Interne ou externe",
        "Immédiat ou différé",
        "Traçabilité complète",
        "Sécurisé",
      ],
      quickStats: {
        today: 0,
        amount: 0,
      },
    },
    {
      title: "Historique",
      description: "Consulter les transactions",
      subtitle: "Relevés et statistiques",
      icon: "archive-outline",
      color: "info",
      route: "/pages/transactions/history",
      features: [
        "Recherche avancée",
        "Filtres par période",
        "Export PDF/CSV",
        "Statistiques détaillées",
      ],
      quickStats: {
        today: 0,
        amount: 0,
      },
    },
  ];

  // Statistiques du jour
  todayStats = {
    totalTransactions: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalTransfers: 0,
    depositsAmount: 0,
    withdrawalsAmount: 0,
    transfersAmount: 0,
    netFlow: 0,
  };

  // Transactions récentes (simulation)
  recentTransactions: any[] = [];

  isLoading = false;

  constructor(
    private router: Router,
    private transactionApi: TransactionApiService,
    private accountApi: AccountApiService
  ) {}

  ngOnInit(): void {
    this.loadRecentActivity();
  }

  /**
   * Charge l'activité récente
   */
  loadRecentActivity(): void {
    this.isLoading = true;

    // Simulation de données récentes
    // Dans un vrai cas, vous appelleriez une API
    setTimeout(() => {
      this.generateMockData();
      this.isLoading = false;
    }, 800);
  }

  /**
   * Génère des données simulées
   */
  private generateMockData(): void {
    const now = new Date();

    // Générer 10 transactions récentes
    this.recentTransactions = Array.from({ length: 10 }, (_, i) => {
      const types = ["DEPOSIT", "WITHDRAWAL", "TRANSFER"];
      const type = types[Math.floor(Math.random() * types.length)];

      const time = new Date(now);
      time.setHours(now.getHours() - i);

      return {
        id: i + 1,
        type,
        time: time.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        client: this.generateRandomName(),
        account: this.generateRandomIBAN(),
        amount: Math.floor(Math.random() * 2000) + 100,
        status: "SUCCESS",
      };
    });

    // Calculer les stats du jour
    this.todayStats = {
      totalTransactions: this.recentTransactions.length,
      totalDeposits: this.recentTransactions.filter((t) => t.type === "DEPOSIT")
        .length,
      totalWithdrawals: this.recentTransactions.filter(
        (t) => t.type === "WITHDRAWAL"
      ).length,
      totalTransfers: this.recentTransactions.filter(
        (t) => t.type === "TRANSFER"
      ).length,
      depositsAmount: this.recentTransactions
        .filter((t) => t.type === "DEPOSIT")
        .reduce((sum, t) => sum + t.amount, 0),
      withdrawalsAmount: this.recentTransactions
        .filter((t) => t.type === "WITHDRAWAL")
        .reduce((sum, t) => sum + t.amount, 0),
      transfersAmount: this.recentTransactions
        .filter((t) => t.type === "TRANSFER")
        .reduce((sum, t) => sum + t.amount, 0),
      netFlow: 0,
    };

    this.todayStats.netFlow =
      this.todayStats.depositsAmount - this.todayStats.withdrawalsAmount;

    // Mettre à jour les stats rapides des opérations
    this.operations[0].quickStats = {
      today: this.todayStats.totalDeposits,
      amount: this.todayStats.depositsAmount,
    };
    this.operations[1].quickStats = {
      today: this.todayStats.totalWithdrawals,
      amount: this.todayStats.withdrawalsAmount,
    };
    this.operations[2].quickStats = {
      today: this.todayStats.totalTransfers,
      amount: this.todayStats.transfersAmount,
    };
    this.operations[3].quickStats = {
      today: this.todayStats.totalTransactions,
      amount: this.todayStats.depositsAmount + this.todayStats.transfersAmount,
    };
  }

  /**
   * Navigation vers une opération
   */
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  /**
   * Helpers
   */
  private generateRandomName(): string {
    const firstNames = [
      "Jean",
      "Marie",
      "Pierre",
      "Sophie",
      "Luc",
      "Emma",
      "Thomas",
      "Julie",
    ];
    const lastNames = [
      "Dupont",
      "Martin",
      "Bernard",
      "Dubois",
      "Thomas",
      "Robert",
      "Richard",
      "Petit",
    ];
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${
      lastNames[Math.floor(Math.random() * lastNames.length)]
    }`;
  }

  private generateRandomIBAN(): string {
    return `FR76 ${Math.floor(Math.random() * 9000 + 1000)} ${Math.floor(
      Math.random() * 9000 + 1000
    )} ${Math.floor(Math.random() * 9000 + 1000)}`;
  }

  getTransactionColor(type: string): string {
    const colors: any = {
      DEPOSIT: "success",
      WITHDRAWAL: "danger",
      TRANSFER: "primary",
    };
    return colors[type] || "basic";
  }

  getTransactionIcon(type: string): string {
    const icons: any = {
      DEPOSIT: "trending-up-outline",
      WITHDRAWAL: "trending-down-outline",
      TRANSFER: "swap-horizontal-outline",
    };
    return icons[type] || "repeat-outline";
  }

  getTransactionLabel(type: string): string {
    const labels: any = {
      DEPOSIT: "Dépôt",
      WITHDRAWAL: "Retrait",
      TRANSFER: "Virement",
    };
    return labels[type] || type;
  }

  abs(value: number): number {
    return Math.abs(value);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  }

  formatNumber(num: number): string {
    return num.toLocaleString("fr-FR");
  }

  getChangePercentage(current: number, previous: number): string {
    if (previous === 0) return "+100%";
    const change = ((current - previous) / previous) * 100;
    return `${change > 0 ? "+" : ""}${change.toFixed(1)}%`;
  }
}
