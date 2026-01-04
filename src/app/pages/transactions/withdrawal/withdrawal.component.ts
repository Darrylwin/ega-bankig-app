import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NbToastrService } from '@nebular/theme';
import { WithdrawalRequest, Account } from '../../../@core/data/models/index';
import {
  TransactionApiService,
  AccountApiService,
} from '../../../@core/data/api/index';

@Component({
  selector: 'ngx-withdrawal',
  templateUrl: './withdrawal.component.html',
  styleUrls: ['./withdrawal.component.scss'],
})
export class WithdrawalComponent implements OnInit {
  withdrawalForm: FormGroup;
  isLoading = false;
  isSubmitting = false;
  accounts: Account[] = [];
  selectedAccount: Account | null = null;
  maxWithdrawalAmount = 0;

  // Étapes du formulaire
  currentStep = 1;
  totalSteps = 3;

  // Options
  withdrawalReasons = [
    { 
      value: 'PERSONAL', 
      label: 'Usage personnel',
      icon: 'person-outline',
      description: 'Besoins personnels quotidiens'
    },
    { 
      value: 'BUSINESS', 
      label:  'Affaires professionnelles',
      icon: 'briefcase-outline',
      description: 'Dépenses professionnelles'
    },
    { 
      value: 'EMERGENCY', 
      label: 'Urgence',
      icon: 'alert-circle-outline',
      description: 'Situation d\'urgence'
    },
    { 
      value: 'OTHER', 
      label: 'Autre',
      icon: 'more-horizontal-outline',
      description: 'Autre motif'
    },
  ];

  // Montants suggérés
  quickAmounts = [1000, 2000, 5000, 10000, 20000, 50000];

  // Limites de retrait
  withdrawalLimits = {
    daily: 1000,
    weekly: 3000,
    monthly: 5000,
  };

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

  /**
   * Crée le formulaire
   */
  private createForm(): FormGroup {
    return this.fb.group({
      accountId: ['', [Validators.required]],
      amount: ['', [Validators. required, Validators.min(0.01)]],
      reason: ['PERSONAL', [Validators.required]],
      idVerified: [false, [Validators.requiredTrue]],
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
            (acc) => acc.status === 'ACTIVE' && acc.balance > 0
          );
          this.isLoading = false;
        },
        error: (error) => {
          this. isLoading = false;
          this.toastr.danger('Erreur lors du chargement des comptes', 'Erreur');
        },
      });
  }

  /**
   * Lorsqu'un compte est sélectionné
   */
  onAccountSelect(): void {
    const accountId = this.withdrawalForm.get('accountId')?.value;
    this.selectedAccount =
      this.accounts.find((acc) => acc.id === accountId) || null;

    if (this.selectedAccount) {
      // Calculer le montant maximum retirable
      this.maxWithdrawalAmount = this.selectedAccount. balance;
      
      // Ajouter découvert pour compte courant
      if (this.selectedAccount.accountType === 'CURRENT') {
        this.maxWithdrawalAmount += 1000; // Découvert autorisé
      }

      // Limiter au maximum journalier
      this.maxWithdrawalAmount = Math.min(
        this.maxWithdrawalAmount,
        this. withdrawalLimits.daily
      );

      // Mettre à jour les validateurs
      this.withdrawalForm
        .get('amount')
        ?.setValidators([
          Validators. required,
          Validators.min(0.01),
          Validators.max(this.maxWithdrawalAmount),
        ]);
      this.withdrawalForm.get('amount')?.updateValueAndValidity();
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
        `Le montant dépasse la limite de ${this.formatCurrency(this.maxWithdrawalAmount)}`,
        'Attention'
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
        this.toastr.warning('Veuillez sélectionner un compte', 'Attention');
        return;
      }

      if (this.currentStep === 2) {
        if (this.f.amount.invalid || this.f.reason.invalid) {
          this.f.amount.markAsTouched();
          this.f.reason.markAsTouched();
          this.toastr.warning('Veuillez remplir tous les champs', 'Attention');
          return;
        }

        if (!this.f.idVerified.value) {
          this.toastr. warning('La vérification d\'identité est obligatoire', 'Attention');
          return;
        }
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
    if (this.withdrawalForm.invalid) {
      this.markFormGroupTouched(this.withdrawalForm);
      this.toastr.warning('Veuillez remplir tous les champs correctement', 'Attention');
      return;
    }

    if (! this.f.idVerified.value) {
      this.toastr.warning(
        'La vérification de la pièce d\'identité est obligatoire',
        'Attention'
      );
      return;
    }

    this.isSubmitting = true;

    const withdrawalData: WithdrawalRequest = {
      accountId: this.withdrawalForm.value.accountId,
      amount: this.withdrawalForm.value. amount,
      description: this.withdrawalForm.value.description || undefined,
    };

    this.transactionApi. withdraw(withdrawalData).subscribe({
      next: (transaction) => {
        this.isSubmitting = false;

        this.toastr.success(
          `Retrait de ${this.formatCurrency(transaction.amount)} effectué avec succès`,
          'Succès',
          { duration: 5000 }
        );

        setTimeout(() => {
          this.router.navigate(['/pages/transactions/history']);
        }, 1500);
      },
      error:  (error) => {
        this.isSubmitting = false;

        if (error.status === 400) {
          this.toastr.warning('Solde insuffisant', 'Erreur');
        } else if (error.status === 403) {
          this.toastr.warning('Compte bloqué ou limité', 'Accès refusé');
        } else {
          this.toastr.danger('Erreur lors du retrait', 'Erreur');
        }
      },
    });
  }

  /**
   * Annule et retourne
   */
  onCancel(): void {
    this.router.navigate(['/pages/transactions']);
  }

  /**
   * Raccourci pour les contrôles
   */
  get f() {
    return this.withdrawalForm.controls;
  }

  /**
   * Récupère le motif sélectionné
   */
  getSelectedReason() {
    return this.withdrawalReasons.find((r) => r.value === this. f.reason.value);
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
    if (percentage > 90) return 'danger';
    if (percentage > 70) return 'warning';
    return 'success';
  }

  /**
   * Vérifie si le montant est élevé
   */
  isHighAmount(): boolean {
    return this.calculateWithdrawalPercentage() > 70;
  }

  /**
   * Vérifie si le montant est critique
   */
  isCriticalAmount(): boolean {
    return this.calculateWithdrawalPercentage() > 90;
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
}