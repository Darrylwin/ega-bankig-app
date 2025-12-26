import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NbToastrService } from '@nebular/theme';
import { AccountApiService, CustomerApiService } from '../../../@core/data/api/index';
import { AccountRequest, Customer } from '../../../@core/data/models/index';

@Component({
  selector: 'ngx-account-form',
  templateUrl: './account-form.component.html',
  styleUrls: ['./account-form.component.scss']
})
export class AccountFormComponent implements OnInit {
  accountForm: FormGroup;
  isLoading = false;
  isSubmitting = false;
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];

  // Options
  accountTypes = [
    { value: 'SAVINGS', label: 'Compte Épargne', icon: 'trending-up-outline' },
    { value: 'CURRENT', label: 'Compte Courant', icon: 'credit-card-outline' }
  ];

  currencies = [
    { value: 'EUR', label: 'Euro (€)' },
    { value: 'USD', label: 'Dollar ($)' },
    { value: 'GBP', label: 'Livre (£)' },
    { value: 'JPY', label: 'Yen (¥)' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private accountApi: AccountApiService,
    private customerApi: CustomerApiService,
    private toastr: NbToastrService
  ) {
    this.accountForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadCustomers();
  }

  /**
   * Crée le formulaire
   */
  private createForm(): FormGroup {
    return this.fb.group({
      customerId: ['', [Validators.required]],
      accountType: ['SAVINGS', [Validators.required]],
      currency: ['EUR', [Validators.required]]
    });
  }

  /**
   * Charge la liste des clients
   */
  private loadCustomers(): void {
    this.isLoading = true;

    // Charge les clients pour l'autocomplete
    this.customerApi.getCustomers({ page: 0, size: 100, sort: 'lastName,asc' }).subscribe({
      next: (response) => {
        this.customers = response.content;
        this.filteredCustomers = [...this.customers];
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.toastr.danger('Erreur lors du chargement des clients', 'Erreur');
      }
    });
  }

  /**
   * Filtre les clients pour l'autocomplete
   */
  filterCustomers(event: any): void {
    const searchTerm = event.target?.value?.toLowerCase() || '';
    
    if (!searchTerm) {
      this.filteredCustomers = [...this.customers];
      return;
    }

    this.filteredCustomers = this.customers.filter(customer =>
      customer.lastName.toLowerCase().includes(searchTerm) ||
      customer.firstName.toLowerCase().includes(searchTerm) ||
      customer.email.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Affiche le nom complet d'un client
   */
  displayCustomerName(customerId: number): string {
    const customer = this.customers.find(c => c.id === customerId);
    return customer ? `${customer.lastName} ${customer.firstName} (${customer.email})` : '';
  }

  /**
   * Soumission du formulaire
   */
  onSubmit(): void {
    if (this.accountForm.invalid) {
      this.markFormGroupTouched(this.accountForm);
      return;
    }

    this.isSubmitting = true;

    const accountData: AccountRequest = this.accountForm.value;

    this.accountApi.createAccount(accountData).subscribe({
      next: (account) => {
        this.isSubmitting = false;
        this.toastr.success(
          `Compte ${this.getAccountTypeLabel(account.accountType)} créé avec succès`,
          'Succès'
        );
        this.router.navigate(['/pages/accounts/detail', account.id]);
      },
      error: (error) => {
        this.isSubmitting = false;
        
        if (error.status === 400) {
          this.toastr.warning('Données invalides', 'Erreur de validation');
        } else if (error.status === 409) {
          this.toastr.warning('Le client a déjà un compte de ce type', 'Conflit');
        } else {
          this.toastr.danger('Erreur lors de la création du compte', 'Erreur');
        }
      }
    });
  }

  /**
   * Annule et retourne à la liste
   */
  onCancel(): void {
    this.router.navigate(['/pages/accounts']);
  }

  /**
   * Raccourci pour accéder aux contrôles du formulaire
   */
  get f() {
    return this.accountForm.controls;
  }

  /**
   * Marque tous les champs comme touchés pour afficher les erreurs
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Retourne le label du type de compte
   */
  getAccountTypeLabel(type: string): string {
    const accountType = this.accountTypes.find(t => t.value === type);
    return accountType ? accountType.label : type;
  }

  /**
   * Calcule le taux d'intérêt (pour les comptes épargne)
   */
  getInterestRate(): number {
    return this.accountForm.value.accountType === 'SAVINGS' ? 2.0 : 0;
  }

  /**
   * Calcule le découvert autorisé (pour les comptes courants)
   */
  getOverdraftLimit(): number {
    return this.accountForm.value.accountType === 'CURRENT' ? 1000 : 0;
  }
}