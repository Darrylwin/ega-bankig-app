import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NbToastrService } from '@nebular/theme';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DepositRequest, Account } from '../../../@core/data/models/index';
import { AccountApiService, TransactionApiService } from '../../../@core/data/api/index';

@Component({
  selector: 'ngx-deposit',
  templateUrl: './deposit.component.html',
  styleUrls: ['./deposit.component.scss'],
})
export class DepositComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  depositForm: FormGroup;
  isLoading = false;
  isSubmitting = false;
  accounts: Account[] = [];
  selectedAccount: Account | null = null;

  // Étapes du formulaire
  currentStep = 1;
  totalSteps = 3;

  // Montants suggérés
  quickAmounts = [50, 100, 200, 500, 1000, 2000];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private transactionApi: TransactionApiService,
    private accountApi: AccountApiService,
    private toastr: NbToastrService
  ) {
    this.depositForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadAccounts();

    // Pré-remplir le accountId si passé en query params
    const accountIdParam = this.route.snapshot.queryParams['accountId'];
    if (accountIdParam) {
      this.depositForm.patchValue({ accountId: +accountIdParam });
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
      accountId: ['', [Validators.required]],
      amount: ['', [Validators. required, Validators.min(0.01), Validators.max(1000000)]],
      description:  ['', [Validators.maxLength(200)]],
    });
  }

  /**
   * Charge la liste des comptes actifs
   */
  private loadAccounts(): void {
    this.isLoading = true;

    this.accountApi
      .getAccounts({ page: 0, size: 1000, sort: 'accountNumber,asc' })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.accounts = response.content. filter((acc) => acc.status === 'ACTIVE');
          
          // Si accountId pré-rempli, sélectionner le compte
          const preselectedId = this.depositForm.value.accountId;
          if (preselectedId) {
            this.onAccountSelect();
          }
          
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          this.toastr.danger('Erreur lors du chargement des comptes', 'Erreur');
          console.error(error);
        },
      });
  }

  /**
   * Lorsqu'un compte est sélectionné
   */
  onAccountSelect(): void {
    const accountId = this.depositForm. get('accountId')?.value;
    this.selectedAccount = this.accounts. find((acc) => acc.id === accountId) || null;
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
      // Valider l'étape actuelle
      if (this.currentStep === 1 && this.f.accountId.invalid) {
        this.f.accountId.markAsTouched();
        this.toastr.warning('Veuillez sélectionner un compte', 'Attention');
        return;
      }

      if (this.currentStep === 2 && this.f.amount. invalid) {
        this.f.amount.markAsTouched();
        this.toastr.warning('Veuillez indiquer un montant valide', 'Attention');
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
   * Soumission du formulaire (API:  POST /api/transactions/deposit)
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
      description: this.depositForm.value.description || undefined,
    };

    this. transactionApi
      .deposit(depositData)
      .pipe(takeUntil(this. destroy$))
      .subscribe({
        next: (transaction) => {
          this.isSubmitting = false;

          this.toastr.success(
            `Dépôt de ${this.formatCurrency(transaction.amount)} effectué avec succès`,
            'Succès',
            { duration: 5000 }
          );

          setTimeout(() => {
            this.router.navigate(['/pages/accounts/detail', this.selectedAccount?.id]);
          }, 1500);
        },
        error:  (error) => {
          this.isSubmitting = false;

          if (error.status === 400) {
            this.toastr.warning('Données invalides', 'Erreur de validation');
          } else if (error.status === 404) {
            this.toastr.warning('Compte introuvable', 'Erreur');
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
   * Helpers
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
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
   * Calcule le total (pas de frais)
   */
  calculateTotal(): number {
    return this.f.amount.value || 0;
  }
}