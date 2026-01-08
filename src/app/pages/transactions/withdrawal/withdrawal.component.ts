import { Component, OnInit, OnDestroy } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router, ActivatedRoute } from "@angular/router";
import { NbToastrService } from "@nebular/theme";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { WithdrawalRequest, Account } from "../../../@core/data/models/index";
import {
  TransactionApiService,
  AccountApiService,
} from "../../../@core/data/api/index";

@Component({
  selector: "ngx-withdrawal",
  templateUrl: "./withdrawal.component.html",
  styleUrls: ["./withdrawal.component.scss"],
})
export class WithdrawalComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  withdrawalForm: FormGroup;
  isLoading = false;
  isSubmitting = false;
  accounts: Account[] = [];
  selectedAccount: Account | null = null;
  maxWithdrawalAmount = 0;

  // Étapes du formulaire
  currentStep = 1;
  totalSteps = 3;

  // Montants suggérés
  quickAmounts = [50, 100, 200, 500, 1000, 2000];

  // Limite journalière (peut être configurée)
  dailyLimit = 1000000;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private transactionApi: TransactionApiService,
    private accountApi: AccountApiService,
    private toastr: NbToastrService
  ) {
    this.withdrawalForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadAccounts();

    // Pré-remplir le accountId si passé en query params
    const accountIdParam = this.route.snapshot.queryParams["accountId"];
    if (accountIdParam) {
      this.withdrawalForm.patchValue({ accountId: +accountIdParam });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Crée le formulaire (selon l'API:  accountId, amount, description optionnelle)
   */
  private createForm(): FormGroup {
    return this.fb.group({
      accountId: ["", [Validators.required]],
      amount: ["", [Validators.required, Validators.min(0.01)]],
      description: ["", [Validators.maxLength(200)]],
    });
  }

  /**
   * Charge la liste des comptes actifs avec solde > 0
   */
  private loadAccounts(): void {
    this.isLoading = true;

    this.accountApi
      .getAccounts({ page: 0, size: 1000, sort: "accountNumber,asc" })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.accounts = response.content.filter(
            (acc) => acc.status === "ACTIVE" && acc.balance > 0
          );

          // Si accountId pré-rempli, sélectionner le compte
          const preselectedId = this.withdrawalForm.value.accountId;
          if (preselectedId) {
            this.onAccountSelect();
          }

          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          this.toastr.danger("Erreur lors du chargement des comptes", "Erreur");
          console.error(error);
        },
      });
  }

  /**
   * Lorsqu'un compte est sélectionné
   */
  onAccountSelect(): void {
    const accountId = this.withdrawalForm.get("accountId")?.value;
    this.selectedAccount =
      this.accounts.find((acc) => acc.id === accountId) || null;

    if (this.selectedAccount) {
      // Calculer le montant maximum retirable
      this.maxWithdrawalAmount = Math.min(
        this.selectedAccount.balance,
        this.dailyLimit
      );

      // Mettre à jour les validateurs
      this.withdrawalForm
        .get("amount")
        ?.setValidators([
          Validators.required,
          Validators.min(0.01),
          Validators.max(this.maxWithdrawalAmount),
        ]);
      this.withdrawalForm.get("amount")?.updateValueAndValidity();
    }
  }

  /**
   * Applique un montant rapide
   */
  applyQuickAmount(amount: number): void {
    if (amount <= this.maxWithdrawalAmount) {
      this.withdrawalForm.patchValue({ amount });
    } else {
      this.toastr.warning(
        `Montant maximum:  ${this.formatCurrency(this.maxWithdrawalAmount)}`,
        "Attention"
      );
    }
  }

  /**
   * Navigation entre les étapes
   */
  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      // Valider l'étape actuelle
      if (this.currentStep === 1 && this.f.accountId.invalid) {
        this.f.accountId.markAsTouched();
        this.toastr.warning("Veuillez sélectionner un compte", "Attention");
        return;
      }

      if (this.currentStep === 2 && this.f.amount.invalid) {
        this.f.amount.markAsTouched();
        this.toastr.warning("Veuillez indiquer un montant valide", "Attention");
        return;
      }

      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  /**
   * Soumission du formulaire (API:  POST /api/transactions/withdraw)
   */
  onSubmit(): void {
    if (this.withdrawalForm.invalid) {
      this.markFormGroupTouched(this.withdrawalForm);
      this.toastr.warning(
        "Veuillez remplir tous les champs correctement",
        "Attention"
      );
      return;
    }

    // Vérifier que le solde est suffisant
    if (
      this.selectedAccount &&
      this.f.amount.value > this.selectedAccount.balance
    ) {
      this.toastr.warning("Solde insuffisant", "Erreur");
      return;
    }

    this.isSubmitting = true;

    const withdrawalData: WithdrawalRequest = {
      accountId: this.withdrawalForm.value.accountId,
      amount: this.withdrawalForm.value.amount,
      description: this.withdrawalForm.value.description || undefined,
    };

    this.transactionApi
      .withdraw(withdrawalData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (transaction) => {
          this.isSubmitting = false;

          this.toastr.success(
            `Retrait de ${this.formatCurrency(
              transaction.amount
            )} effectué avec succès`,
            "Succès",
            { duration: 5000 }
          );

          setTimeout(() => {
            this.router.navigate([
              "/pages/accounts/detail",
              this.selectedAccount?.id,
            ]);
          }, 1500);
        },
        error: (error) => {
          this.isSubmitting = false;

          if (error.status === 400) {
            this.toastr.warning(
              "Solde insuffisant ou données invalides",
              "Erreur"
            );
          } else if (error.status === 404) {
            this.toastr.warning("Compte introuvable", "Erreur");
          } else {
            this.toastr.danger("Erreur lors du retrait", "Erreur");
          }
        },
      });
  }

  /**
   * Annule et retourne
   */
  onCancel(): void {
    this.router.navigate(["/pages/transactions"]);
  }

  /**
   * Raccourci pour les contrôles
   */
  get f() {
    return this.withdrawalForm.controls;
  }

  /**
   * Calcule le pourcentage du retrait
   */
  calculateWithdrawalPercentage(): number {
    const amount = this.f.amount.value || 0;
    return this.maxWithdrawalAmount > 0
      ? (amount / this.maxWithdrawalAmount) * 100
      : 0;
  }

  /**
   * Retourne le statut de la barre de progression
   */
  getProgressStatus(): string {
    const percentage = this.calculateWithdrawalPercentage();
    if (percentage > 90) return "danger";
    if (percentage > 70) return "warning";
    return "success";
  }

  /**
   * Vérifie si le montant est élevé (> 70%)
   */
  isHighAmount(): boolean {
    return this.calculateWithdrawalPercentage() > 70;
  }

  /**
   * Vérifie si le montant est critique (> 90%)
   */
  isCriticalAmount(): boolean {
    return this.calculateWithdrawalPercentage() > 90;
  }

  /**
   * Helpers
   */
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

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
