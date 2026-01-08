import { Component, OnInit, OnDestroy } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { NbToastrService } from "@nebular/theme";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import {
  AccountApiService,
  TransactionApiService,
} from "../../../@core/data/api/index";
import { Account, Transaction } from "../../../@core/data/models/index";

@Component({
  selector: "ngx-account-statement",
  templateUrl: "./account-statement.component.html",
  styleUrls: ["./account-statement.component.scss"],
})
export class AccountStatementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  accountId: number = 0;
  account: Account | null = null;

  // Formulaire
  startDate: string = "";
  endDate: string = "";
  format: string = "pdf";
  today: string = "";

  // Options (simplifiées)
  includeHeader: boolean = true;
  includeFooter: boolean = true;
  includeSummary: boolean = true;

  // États
  isLoading = false;
  isGenerating = false;
  isLoadingPreview = false;

  // Aperçu
  previewTransactions: Transaction[] = [];
  previewStats = {
    totalTransactions: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalTransfers: 0,
    depositAmount: 0,
    withdrawalAmount: 0,
    transferAmount: 0,
    openingBalance: 0,
    closingBalance: 0,
    netChange: 0,
  };

  // Formats disponibles
  formats = [
    {
      value: "pdf",
      label: "PDF",
      icon: "file-text-outline",
      description: "Format standard pour impression",
      color: "danger",
      features: [
        "Optimisé pour l'impression",
        "Signature numérique",
        "Compatible tous systèmes",
      ],
    },
  ];

  // Périodes prédéfinies
  quickPeriods = [
    {
      label: "Ce mois",
      icon: "calendar-outline",
      action: () => this.setCurrentMonth(),
    },
    {
      label: "Mois dernier",
      icon: "arrow-back-outline",
      action: () => this.setLastMonth(),
    },
    {
      label: "30 derniers jours",
      icon: "clock-outline",
      action: () => this.setLast30Days(),
    },
    {
      label: "3 derniers mois",
      icon: "calendar-outline",
      action: () => this.setLast3Months(),
    },
    {
      label: "Cette année",
      icon: "calendar-outline",
      action: () => this.setCurrentYear(),
    },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private accountApi: AccountApiService,
    private transactionApi: TransactionApiService,
    private toastr: NbToastrService
  ) {}

  ngOnInit(): void {
    this.accountId = +this.route.snapshot.params["id"];
    this.today = this.formatDateForInput(new Date());
    this.setCurrentMonth();

    if (this.accountId) {
      this.loadAccount();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charge les informations du compte
   */
  loadAccount(): void {
    this.isLoading = true;

    this.accountApi
      .getAccountById(this.accountId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (account) => {
          this.account = account;
          this.isLoading = false;
          this.loadPreview();
        },
        error: (error) => {
          this.isLoading = false;
          this.toastr.danger("Erreur lors du chargement du compte", "Erreur");
          this.router.navigate(["/pages/accounts"]);
        },
      });
  }

  /**
   * Charge l'aperçu des transactions
   */
  loadPreview(): void {
    if (!this.startDate || !this.endDate) return;

    this.isLoadingPreview = true;

    const startISO = `${this.startDate}T00:00:00`;
    const endISO = `${this.endDate}T23:59:59`;

    this.transactionApi
      .getTransactionsByPeriod(this.accountId, startISO, endISO)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (transactions) => {
          this.previewTransactions = transactions;
          this.calculatePreviewStats(transactions);
          this.isLoadingPreview = false;
        },
        error: (error) => {
          this.isLoadingPreview = false;
          console.error("Erreur chargement aperçu:", error);
        },
      });
  }

  /**
   * Calcule les statistiques de l'aperçu
   */
  calculatePreviewStats(transactions: Transaction[]): void {
    this.previewStats.totalTransactions = transactions.length;

    const deposits = transactions.filter(
      (t) => t.transactionType === "DEPOSIT"
    );
    const withdrawals = transactions.filter(
      (t) => t.transactionType === "WITHDRAWAL"
    );
    const transfers = transactions.filter(
      (t) => t.transactionType === "TRANSFER"
    );

    this.previewStats.totalDeposits = deposits.length;
    this.previewStats.totalWithdrawals = withdrawals.length;
    this.previewStats.totalTransfers = transfers.length;

    this.previewStats.depositAmount = deposits.reduce(
      (sum, t) => sum + t.amount,
      0
    );
    this.previewStats.withdrawalAmount = withdrawals.reduce(
      (sum, t) => sum + Math.abs(t.amount),
      0
    );
    this.previewStats.transferAmount = transfers.reduce(
      (sum, t) => sum + Math.abs(t.amount),
      0
    );

    if (transactions.length > 0) {
      const sorted = [...transactions].sort(
        (a, b) =>
          new Date(a.transactionDate).getTime() -
          new Date(b.transactionDate).getTime()
      );
      this.previewStats.openingBalance = sorted[0].balanceBefore;
      this.previewStats.closingBalance = sorted[sorted.length - 1].balanceAfter;
      this.previewStats.netChange =
        this.previewStats.closingBalance - this.previewStats.openingBalance;
    } else if (this.account) {
      this.previewStats.openingBalance = this.account.balance;
      this.previewStats.closingBalance = this.account.balance;
      this.previewStats.netChange = 0;
    }
  }

  /**
   * Génère le relevé
   */
  generateStatement(): void {
    if (!this.startDate || !this.endDate) {
      this.toastr.warning("Veuillez sélectionner une période", "Attention");
      return;
    }

    if (new Date(this.startDate) > new Date(this.endDate)) {
      this.toastr.warning(
        "La date de début doit être avant la date de fin",
        "Erreur"
      );
      return;
    }

    this.isGenerating = true;

    const startISO = `${this.startDate}T00:00:00`;
    const endISO = `${this.endDate}T23:59:59`;

    this.accountApi
      .generateStatement(this.accountId, startISO, endISO)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          this.isGenerating = false;

          // Télécharger le fichier
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;

          const extension = this.format;
          const filename = `releve_${this.account?.accountNumber}_${this.startDate}_${this.endDate}.${extension}`;

          a.download = filename;
          a.click();
          window.URL.revokeObjectURL(url);

          this.toastr.success(
            `Relevé ${this.format.toUpperCase()} généré avec succès`,
            "Succès"
          );
        },
        error: (error) => {
          this.isGenerating = false;
          this.toastr.danger(
            "Erreur lors de la génération du relevé",
            "Erreur"
          );
        },
      });
  }

  /**
   * Périodes prédéfinies
   */
  setCurrentMonth(): void {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    this.startDate = this.formatDateForInput(firstDay);
    this.endDate = this.formatDateForInput(today);
    if (this.account) {
      this.loadPreview();
    }
  }

  setLastMonth(): void {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);

    this.startDate = this.formatDateForInput(firstDay);
    this.endDate = this.formatDateForInput(lastDay);
    this.loadPreview();
  }

  setLast30Days(): void {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    this.startDate = this.formatDateForInput(thirtyDaysAgo);
    this.endDate = this.formatDateForInput(today);
    this.loadPreview();
  }

  setLast3Months(): void {
    const today = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(today.getMonth() - 3);

    this.startDate = this.formatDateForInput(threeMonthsAgo);
    this.endDate = this.formatDateForInput(today);
    this.loadPreview();
  }

  setCurrentYear(): void {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), 0, 1);

    this.startDate = this.formatDateForInput(firstDay);
    this.endDate = this.formatDateForInput(today);
    this.loadPreview();
  }

  /**
   * Événements
   */
  onDateChange(): void {
    if (this.startDate && this.endDate) {
      this.loadPreview();
    }
  }

  onFormatChange(format: string): void {
    this.format = format;
  }

  onBack(): void {
    this.router.navigate(["/pages/accounts/detail", this.accountId]);
  }

  /**
   * Helpers
   */
  formatDateForInput(date: Date): string {
    return date.toISOString().split("T")[0];
  }

  formatDate(dateString: string): string {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("fr-FR");
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  }

  formatAccountNumber(iban: string): string {
    return iban ? iban.match(/.{1,4}/g)?.join(" ") || iban : "";
  }

  formatNumber(num: number): string {
    return num?.toLocaleString("fr-FR") || "0";
  }

  getSelectedFormat() {
    return this.formats.find((f) => f.value === this.format);
  }

  getDaysBetween(): number {
    if (!this.startDate || !this.endDate) return 0;
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  getTransactionTypeLabel(type: string): string {
    const labels: any = {
      DEPOSIT: "Dépôt",
      WITHDRAWAL: "Retrait",
      TRANSFER: "Virement",
    };
    return labels[type] || type;
  }

  getTransactionTypeIcon(type: string): string {
    const icons: any = {
      DEPOSIT: "arrow-downward-outline",
      WITHDRAWAL: "arrow-upward-outline",
      TRANSFER: "swap-outline",
    };
    return icons[type] || "activity-outline";
  }
}
