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

  // Options
  transferTypes = [
    { value: "IMMEDIATE", label: "Immédiat", icon: "flash-outline" },
    { value: "SCHEDULED", label: "Programmé", icon: "calendar-outline" },
    { value: "RECURRING", label: "Récurrent", icon: "repeat-outline" },
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private transactionApi: TransactionApiService,
    private accountApi: AccountApiService,
    private toastr: NbToastrService
  ) {
    this.transferForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadAccounts();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      sourceAccountId: ["", [Validators.required]],
      destinationAccountId: ["", [Validators.required]],
      amount: ["", [Validators.required, Validators.min(0.01)]],
      transferType: ["IMMEDIATE", [Validators.required]],
      scheduledDate: [""],
      description: ["", [Validators.maxLength(200)]],
      reference: [this.generateReference()],
    });
  }

  private loadAccounts(): void {
    this.isLoading = true;

    this.accountApi
      .getAccounts({ page: 0, size: 200, sort: "accountNumber,asc" })
      .subscribe({
        next: (response) => {
          this.accounts = response.content;
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

  /**
   * Génère une référence unique
   */
  private generateReference(): string {
    return "VIR-" + Date.now().toString().slice(-8);
  }

  /**
   * Lorsque le compte source change
   */
  onSourceAccountSelect(): void {
    const accountId = this.transferForm.get("sourceAccountId")?.value;
    this.selectedSourceAccount =
      this.accounts.find((acc) => acc.id === accountId) || null;

    // Met à jour la liste des comptes destination (exclut le compte source)
    this.destinationAccounts = this.accounts.filter(
      (acc) => acc.id !== accountId
    );

    // Réinitialise la sélection destination si c'était le même compte
    if (this.transferForm.get("destinationAccountId")?.value === accountId) {
      this.transferForm.patchValue({ destinationAccountId: "" });
      this.selectedDestAccount = null;
    }
  }

  /**
   * Lorsque le compte destination change
   */
  onDestAccountSelect(): void {
    const accountId = this.transferForm.get("destinationAccountId")?.value;
    this.selectedDestAccount =
      this.accounts.find((acc) => acc.id === accountId) || null;
  }

  /**
   * Vérifie que les comptes sont différents
   */
  validateDifferentAccounts(): boolean {
    const sourceId = this.transferForm.get("sourceAccountId")?.value;
    const destId = this.transferForm.get("destinationAccountId")?.value;

    if (sourceId && destId && sourceId === destId) {
      this.toastr.warning(
        "Les comptes source et destination doivent être différents",
        "Attention"
      );
      return false;
    }
    return true;
  }

  /**
   * Soumission du formulaire
   */
  onSubmit(): void {
    if (this.transferForm.invalid) {
      this.markFormGroupTouched(this.transferForm);
      return;
    }

    if (!this.validateDifferentAccounts()) {
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
          "Succès"
        );

        this.showConfirmation(transaction);
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

  private showConfirmation(transaction: any): void {
    setTimeout(() => {
      this.router.navigate(["/pages/transactions/history"]);
    }, 1500);
  }

  onCancel(): void {
    this.router.navigate(["/pages/transactions"]);
  }

  get f() {
    return this.transferForm.controls;
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

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }
}
