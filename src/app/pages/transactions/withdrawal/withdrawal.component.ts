import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { NbToastrService } from "@nebular/theme";
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
export class WithdrawalComponent implements OnInit {
  withdrawalForm: FormGroup;
  isLoading = false;
  isSubmitting = false;
  accounts: Account[] = [];
  selectedAccount: Account | null = null;
  maxWithdrawalAmount = 0;

  // Options
  withdrawalReasons = [
    { value: "PERSONAL", label: "Usage personnel" },
    { value: "BUSINESS", label: "Affaires professionnelles" },
    { value: "EMERGENCY", label: "Urgence" },
    { value: "OTHER", label: "Autre" },
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private transactionApi: TransactionApiService,
    private accountApi: AccountApiService,
    private toastr: NbToastrService
  ) {
    this.withdrawalForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadAccounts();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      accountId: ["", [Validators.required]],
      amount: ["", [Validators.required, Validators.min(0.01)]],
      reason: ["PERSONAL", [Validators.required]],
      idVerified: [false, [Validators.requiredTrue]],
      description: ["", [Validators.maxLength(200)]],
    });
  }

  private loadAccounts(): void {
    this.isLoading = true;

    this.accountApi
      .getAccounts({ page: 0, size: 100, sort: "accountNumber,asc" })
      .subscribe({
        next: (response) => {
          this.accounts = response.content;
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          this.toastr.danger("Erreur lors du chargement des comptes", "Erreur");
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
      this.maxWithdrawalAmount = this.selectedAccount.balance;
      if (this.selectedAccount.accountType === "CURRENT") {
        this.maxWithdrawalAmount += 1000;
      }

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
   * Soumission du formulaire
   */
  onSubmit(): void {
    if (this.withdrawalForm.invalid) {
      this.markFormGroupTouched(this.withdrawalForm);
      return;
    }

    if (!this.withdrawalForm.value.idVerified) {
      this.toastr.warning(
        "La vérification de la pièce d'identité est obligatoire",
        "Attention"
      );
      return;
    }

    this.isSubmitting = true;

    const withdrawalData: WithdrawalRequest = {
      accountId: this.withdrawalForm.value.accountId,
      amount: this.withdrawalForm.value.amount,
      description: this.withdrawalForm.value.description || undefined,
    };

    this.transactionApi.withdraw(withdrawalData).subscribe({
      next: (transaction) => {
        this.isSubmitting = false;

        this.toastr.success(
          `Retrait de ${this.formatCurrency(
            transaction.amount
          )} effectué avec succès`,
          "Succès"
        );

        this.showConfirmation(transaction);
      },
      error: (error) => {
        this.isSubmitting = false;

        if (error.status === 400) {
          this.toastr.warning("Solde insuffisant", "Erreur");
        } else if (error.status === 403) {
          this.toastr.warning("Compte bloqué ou limité", "Accès refusé");
        } else {
          this.toastr.danger("Erreur lors du retrait", "Erreur");
        }
      },
    });
  }

  private showConfirmation(transaction: any): void {
    setTimeout(() => {
      this.router.navigate(["/pages/transactions/history"]);
    }, 1500);
  }

  onCancel(): void {
    this.router.navigate(["/pages/transactions"]);
  }

  get f() {
    return this.withdrawalForm.controls;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  }

  formatAccountNumber(iban: string): string {
    return iban.replace(/(.{4})/g, "$1 ").trim();
  }

  /**
   * Calcule le pourcentage du retrait par rapport au maximum
   */
  calculateWithdrawalPercentage(): number {
    const amount = this.withdrawalForm.value.amount || 0;
    return this.maxWithdrawalAmount > 0
      ? (amount / this.maxWithdrawalAmount) * 100
      : 0;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Retourne le label du motif de retrait sélectionné
   */
  getSelectedReasonLabel(): string {
    const reason = this.withdrawalReasons.find(
      (r) => r.value === this.f.reason.value
    );
    return reason ? reason.label : "";
  }
}
