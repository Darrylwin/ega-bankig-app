import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { NbToastrService } from "@nebular/theme";
import {
  TransactionApiService,
  AccountApiService,
} from "../../../@core/data/api/index";
import { Account, TransferRequest } from "../../../@core/data/models/index";

@Component({
  selector: "ngx-transfer",
  templateUrl: "./transfer.component.html",
  styleUrls: ["./transfer.component.scss"],
})
export class TransferComponent implements OnInit {
  transferForm: FormGroup;
  isLoading = false;
  isSubmitting = false;
  accounts: Account[] = [];
  sourceAccounts: Account[] = [];
  destinationAccounts: Account[] = [];

  selectedSourceAccount: Account | null = null;
  selectedDestAccount: Account | null = null;

  // Étapes du formulaire
  currentStep = 1;
  totalSteps = 3;

  // Référence de transaction
  transactionReference: string = "";

  // Montants suggérés
  quickAmounts = [1000, 2000, 5000, 10000, 20000, 50000];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private transactionApi: TransactionApiService,
    private accountApi: AccountApiService,
    private toastr: NbToastrService
  ) {
    this.transferForm = this.createForm();
    this.generateTransactionReference();
  }

  ngOnInit(): void {
    this.loadAccounts();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      sourceAccountId: ["", [Validators.required]],
      destinationAccountId: ["", [Validators.required]],
      amount: [
        "",
        [Validators.required, Validators.min(0.01), Validators.max(100000)],
      ],
      description: ["", [Validators.maxLength(200)]],
    });
  }

  private generateTransactionReference(): void {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    this.transactionReference = `TRF-${timestamp}-${random}`.toUpperCase();
  }

  private loadAccounts(): void {
    this.isLoading = true;

    this.accountApi
      .getAccounts({ page: 0, size: 200, sort: "accountNumber,asc" })
      .subscribe({
        next: (response) => {
          this.accounts = response.content.filter(
            (acc) => acc.status === "ACTIVE"
          );
          this.sourceAccounts = [...this.accounts];
          this.destinationAccounts = [...this.accounts];
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          this.toastr.danger("Erreur lors du chargement des comptes", "Erreur");
        },
      });
  }

  onSourceAccountSelect(): void {
    const accountId = this.transferForm.get("sourceAccountId")?.value;
    this.selectedSourceAccount =
      this.accounts.find((acc) => acc.id === accountId) || null;

    this.destinationAccounts = this.accounts.filter(
      (acc) => acc.id !== accountId
    );

    if (this.transferForm.get("destinationAccountId")?.value === accountId) {
      this.transferForm.patchValue({ destinationAccountId: "" });
      this.selectedDestAccount = null;
    }

    if (this.selectedSourceAccount) {
      const maxAmount = this.selectedSourceAccount.balance;
      this.transferForm
        .get("amount")
        ?.setValidators([
          Validators.required,
          Validators.min(0.01),
          Validators.max(maxAmount),
        ]);
      this.transferForm.get("amount")?.updateValueAndValidity();
    }
  }

  onDestAccountSelect(): void {
    const accountId = this.transferForm.get("destinationAccountId")?.value;
    this.selectedDestAccount =
      this.accounts.find((acc) => acc.id === accountId) || null;
  }

  areAccountsDifferent(): boolean {
    const sourceId = this.transferForm.get("sourceAccountId")?.value;
    const destId = this.transferForm.get("destinationAccountId")?.value;
    return sourceId && destId && sourceId !== destId;
  }

  applyQuickAmount(amount: number): void {
    if (
      this.selectedSourceAccount &&
      amount <= this.selectedSourceAccount.balance
    ) {
      this.transferForm.patchValue({ amount });
    } else {
      this.toastr.warning("Solde insuffisant pour ce montant", "Attention");
    }
  }

  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      if (this.currentStep === 1) {
        if (
          this.f.sourceAccountId.invalid ||
          this.f.destinationAccountId.invalid
        ) {
          this.f.sourceAccountId.markAsTouched();
          this.f.destinationAccountId.markAsTouched();
          this.toastr.warning(
            "Veuillez sélectionner les deux comptes",
            "Attention"
          );
          return;
        }

        if (!this.areAccountsDifferent()) {
          this.toastr.warning(
            "Les comptes source et destination doivent être différents",
            "Attention"
          );
          return;
        }
      }

      if (this.currentStep === 2 && this.f.amount.invalid) {
        this.f.amount.markAsTouched();
        this.toastr.warning("Veuillez saisir un montant valide", "Attention");
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

  onSubmit(): void {
    if (this.transferForm.invalid) {
      this.markFormGroupTouched(this.transferForm);
      this.toastr.warning(
        "Veuillez remplir tous les champs correctement",
        "Attention"
      );
      return;
    }

    if (!this.areAccountsDifferent()) {
      this.toastr.warning(
        "Les comptes source et destination doivent être différents",
        "Attention"
      );
      return;
    }

    this.isSubmitting = true;

    const transferData: TransferRequest = {
      sourceAccountId: this.transferForm.value.sourceAccountId,
      destinationAccountId: this.transferForm.value.destinationAccountId,
      amount: this.transferForm.value.amount,
      description: this.transferForm.value.description || undefined,
    };

    this.transactionApi.transfer(transferData).subscribe({
      next: (transaction) => {
        this.isSubmitting = false;

        this.toastr.success(
          `Virement de ${this.formatCurrency(
            transaction.amount
          )} effectué avec succès`,
          "Succès",
          { duration: 5000 }
        );

        setTimeout(() => {
          this.router.navigate(["/pages/transactions/history"]);
        }, 1500);
      },
      error: (error) => {
        this.isSubmitting = false;

        if (error.status === 400) {
          this.toastr.warning(
            "Solde insuffisant ou données invalides",
            "Erreur"
          );
        } else if (error.status === 403) {
          this.toastr.warning("Compte source bloqué ou limité", "Accès refusé");
        } else if (error.status === 404) {
          this.toastr.warning("Compte destination introuvable", "Erreur");
        } else {
          this.toastr.danger("Erreur lors du virement", "Erreur");
        }
      },
    });
  }

  onCancel(): void {
    this.router.navigate(["/pages/transactions"]);
  }

  get f() {
    return this.transferForm.controls;
  }

  calculateFees(): number {
    return 0; // Pas de frais selon l'API
  }

  calculateTotal(): number {
    const amount = this.f.amount.value || 0;
    return amount + this.calculateFees();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  formatAccountNumber(iban: string): string {
    return iban ? iban.match(/.{1,4}/g)?.join(" ") || iban : "";
  }

  formatDate(dateString: string): string {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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
