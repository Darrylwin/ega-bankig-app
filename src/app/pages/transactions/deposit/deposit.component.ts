import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NbToastrService } from '@nebular/theme';
import { DepositRequest, Account } from '../../../@core/data/models/index';
import {
  AccountApiService,
  TransactionApiService,
} from '../../../@core/data/api/index';

@Component({
  selector: 'ngx-deposit',
  templateUrl: './deposit.component.html',
  styleUrls: ['./deposit.component.scss'],
})
export class DepositComponent implements OnInit {
  depositForm: FormGroup;
  isLoading = false;
  isSubmitting = false;
  accounts: Account[] = [];
  selectedAccount: Account | null = null;

  // Étapes du formulaire
  currentStep = 1;
  totalSteps = 3;

  // Options
  paymentMethods = [
    {
      value: 'CASH',
      label: 'Espèces',
      icon: 'cube-outline',
      description: 'Dépôt en espèces au guichet',
      limit: 5000,
      delay: 'Immédiat',
    },
    {
      value: 'CHECK',
      label: 'Chèque',
      icon:  'file-text-outline',
      description: 'Dépôt par chèque bancaire',
      limit: 10000,
      delay: '2 jours ouvrés',
    },
    {
      value: 'WIRE_TRANSFER',
      label: 'Virement',
      icon: 'swap-horizontal-outline',
      description: 'Virement bancaire entrant',
      limit: 50000,
      delay: '24 heures',
    },
    {
      value: 'CARD',
      label: 'Carte Bancaire',
      icon: 'credit-card-outline',
      description: 'Paiement par carte',
      limit: 3000,
      delay: 'Immédiat',
    },
  ];

  // Montants suggérés
  quickAmounts = [100, 200, 500, 1000, 2000, 5000];

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
      accountId: ['', [Validators. required]],
      amount: [
        '',
        [Validators.required, Validators.min(0.01), Validators.max(100000)],
      ],
      paymentMethod: ['CASH', [Validators.required]],
      reference: [''],
      description: ['', [Validators.maxLength(200)]],
    });
  }

  /**
   * Charge la liste des comptes
   */
  private loadAccounts(): void {
    this.isLoading = true;

    this.accountApi
      .getAccounts({ page: 0, size: 100, sort: 'accountNumber,asc' })
      .subscribe({
        next: (response) => {
          this.accounts = response.content. filter(
            (acc) => acc.status === 'ACTIVE'
          );
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          this.toastr.danger('Erreur lors du chargement des comptes', 'Erreur');
        },
      });
  }

  /**
   * Lorsqu'un compte est sélectionné
   */
  onAccountSelect(): void {
    const accountId = this.depositForm.get('accountId')?.value;
    this.selectedAccount =
      this.accounts.find((acc) => acc.id === accountId) || null;
  }

  /**
   * Applique un montant rapide
   */
  applyQuickAmount(amount: number): void {
    this.depositForm.patchValue({ amount });
  }

  /**
   * Navigation entre les étapes
   */
  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      // Valider l'étape actuelle avant de passer à la suivante
      if (this. currentStep === 1 && this.f.accountId.invalid) {
        this.f.accountId.markAsTouched();
        this.toastr.warning('Veuillez sélectionner un compte', 'Attention');
        return;
      }

      if (this.currentStep === 2 && (this.f.amount.invalid || this.f.paymentMethod.invalid)) {
        this.f.amount.markAsTouched();
        this.f.paymentMethod.markAsTouched();
        this.toastr.warning('Veuillez remplir tous les champs', 'Attention');
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
   * Soumission du formulaire
   */
  onSubmit(): void {
    if (this.depositForm.invalid) {
      this.markFormGroupTouched(this.depositForm);
      this.toastr.warning('Veuillez remplir tous les champs correctement', 'Attention');
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
          `Dépôt de ${this.formatCurrency(transaction.amount)} effectué avec succès`,
          'Succès',
          { duration: 5000 }
        );

        setTimeout(() => {
          this.router.navigate(['/pages/transactions/history']);
        }, 1500);
      },
      error: (error) => {
        this.isSubmitting = false;

        if (error.status === 400) {
          this.toastr.warning('Données invalides', 'Erreur de validation');
        } else if (error.status === 409) {
          this.toastr.warning('Limite de dépôt atteinte', 'Attention');
        } else {
          this.toastr.danger('Erreur lors du dépôt', 'Erreur');
        }
      },
    });
  }

  /**
   * Annule et retourne
   */
  onCancel(): void {
    this.router. navigate(['/pages/transactions']);
  }

  /**
   * Raccourci pour les contrôles
   */
  get f() {
    return this.depositForm.controls;
  }

  /**
   * Récupère le mode de paiement sélectionné
   */
  getSelectedPaymentMethod() {
    return this.paymentMethods.find(
      (m) => m.value === this. f.paymentMethod.value
    );
  }

  /**
   * Helpers
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }

  formatAccountNumber(iban: string): string {
    return iban ?  iban.match(/.{1,4}/g)?.join(' ') || iban : '';
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control. markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Calcule les frais (ici 0€ pour tous)
   */
  calculateFees(): number {
    return 0;
  }

  /**
   * Calcule le total
   */
  calculateTotal(): number {
    const amount = this.f.amount.value || 0;
    return amount + this.calculateFees();
  }

  /**
   * Vérifie si le montant dépasse la limite
   */
  isAmountOverLimit(): boolean {
    const method = this.getSelectedPaymentMethod();
    const amount = this.f.amount. value || 0;
    return method ?  amount > method.limit : false;
  }
}