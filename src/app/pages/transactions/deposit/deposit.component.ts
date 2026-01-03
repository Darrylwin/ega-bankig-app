import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { NbToastrService } from "@nebular/theme";
import { DepositRequest, Account } from "../../../@core/data/models/index";
import {
  AccountApiService,
  TransactionApiService,
} from "../../../@core/data/api/index";

@Component({
  selector: "ngx-deposit",
  templateUrl: "./deposit.component.html",
  styleUrls: ["./deposit.component.scss"],
})
export class DepositComponent implements OnInit {
  depositForm: FormGroup;
  isLoading = false;
  isSubmitting = false;
  accounts: Account[] = [];
  selectedAccount: Account | null = null;

  // Options
  paymentMethods = [
    { value: "CASH", label:  "Espèces", icon: "cash-outline" },
    { value: "CHECK", label: "Chèque", icon: "file-text-outline" },
    {
      value: "WIRE_TRANSFER",
      label: "Virement",
      icon: "swap-horizontal-outline",
    },
    { value: "CARD", label: "Carte", icon: "credit-card-outline" },
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private transactionApi: TransactionApiService,
    private accountApi: AccountApiService,
    private toastr: NbToastrService
  ) {
    this.depositForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadAccounts();
  }

  /**
   * Crée le formulaire
   */
  private createForm(): FormGroup {
    return this.fb.group({
      accountId: ["", [Validators.required]],
      amount: [
        "",
        [Validators.required, Validators.min(0.01), Validators.max(100000)],
      ],
      paymentMethod: ["CASH", [Validators.required]],
      reference: [""],
      description: ["", [Validators.maxLength(200)]],
    });
  }

  /**
   * Charge la liste des comptes
   */
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
    const accountId = this.depositForm.get("accountId")?.value;
    this.selectedAccount =
      this.accounts.find((acc) => acc.id === accountId) || null;
  }

  /**
   * Soumission du formulaire
   */
  onSubmit(): void {
    if (this.depositForm.invalid) {
      this.markFormGroupTouched(this. depositForm);
      return;
    }

    this.isSubmitting = true;

    const depositData: DepositRequest = {
      accountId: this.depositForm.value.accountId,
      amount: this.depositForm.value.amount,
      description: this.depositForm.value. description || undefined,
    };

    this.transactionApi. deposit(depositData).subscribe({
      next: (transaction) => {
        this.isSubmitting = false;

        this.toastr.success(
          `Dépôt de ${this.formatCurrency(
            transaction.amount
          )} effectué avec succès`,
          "Succès"
        );

        this.showConfirmation(transaction);
      },
      error: (error) => {
        this.isSubmitting = false;

        if (error.status === 400) {
          this.toastr.warning("Données invalides", "Erreur de validation");
        } else if (error.status === 409) {
          this.toastr.warning("Limite de dépôt atteinte", "Attention");
        } else {
          this.toastr.danger("Erreur lors du dépôt", "Erreur");
        }
      },
    });
  }

  /**
   * Affiche la confirmation
   */
  private showConfirmation(transaction: any): void {
    setTimeout(() => {
      this.router.navigate(["/pages/transactions/history"]);
    }, 1500);
  }

  /**
   * Annule et retourne
   */
  onCancel(): void {
    this.router. navigate(["/pages/transactions"]);
  }

  /**
   * Raccourci pour les contrôles
   */
  get f() {
    return this.depositForm.controls;
  }

  /**
   * Formate la monnaie
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  }

  /**
   * Formatte le numéro de compte
   */
  formatAccountNumber(iban: string): string {
    return iban.replace(/(. {4})/g, "$1 ").trim();
  }

  /**
   * Marque tous les champs comme touchés
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control. markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Retourne le label du mode de paiement sélectionné
   */
  getSelectedPaymentMethodLabel(): string {
    const method = this.paymentMethods. find(m => m.value === this.f.paymentMethod.value);
    return method ? method.label : '';
  }
}