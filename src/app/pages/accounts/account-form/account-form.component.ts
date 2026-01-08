import { Component, OnInit, OnDestroy } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { NbToastrService } from "@nebular/theme";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import {
  AccountApiService,
  CustomerApiService,
} from "../../../@core/data/api/index";
import { AccountRequest, Customer } from "../../../@core/data/models/index";

@Component({
  selector: "ngx-account-form",
  templateUrl: "./account-form.component.html",
  styleUrls: ["./account-form.component.scss"],
})
export class AccountFormComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  accountForm: FormGroup;
  isLoading = false;
  isSubmitting = false;

  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  selectedCustomer: Customer | null = null;

  // Options - SIMPLIFIÉ
  accountTypes = [
    {
      value: "SAVINGS",
      label: "Compte Épargne",
      icon: "trending-up-outline",
      description: "Idéal pour épargner avec un taux d'intérêt attractif",
      features: [
        "Taux d'intérêt attractif",
        "Pas de frais de tenue de compte",
        "Capital garanti",
      ],
      color: "success",
    },
    {
      value: "CURRENT",
      label: "Compte Courant",
      icon: "credit-card-outline",
      description: "Pour vos opérations bancaires quotidiennes",
      features: [
        "Découvert autorisé",
        "Carte bancaire incluse",
        "Opérations illimitées",
      ],
      color: "primary",
    },
  ];

  // DEVISE FIXÉE À XOF (Francs CFA)
  readonly CURRENCY = "XOF";
  readonly CURRENCY_LABEL = "Francs CFA";
  readonly CURRENCY_SYMBOL = "FCFA";

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private accountApi: AccountApiService,
    private customerApi: CustomerApiService,
    private toastr: NbToastrService
  ) {
    this.accountForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadCustomers();

    // Pré-remplir le customerId si passé en query params
    const customerIdParam = this.route.snapshot.queryParams["customerId"];
    if (customerIdParam) {
      this.accountForm.patchValue({ customerId: +customerIdParam });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Formulaire simplifié - UNIQUEMENT les champs requis par l'API
   * La devise est fixée à XOF automatiquement
   */
  private createForm(): FormGroup {
    return this.fb.group({
      customerId: ["", [Validators.required]],
      accountType: ["SAVINGS", [Validators.required]],
      // currency est fixe, pas besoin dans le formulaire
    });
  }

  private loadCustomers(): void {
    this.isLoading = true;

    this.customerApi
      .getCustomers({ page: 0, size: 1000, sort: "lastName,asc" })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.customers = response.content;
          this.filteredCustomers = [...this.customers];

          // Si customerId pré-rempli, sélectionner le client
          const preselectedId = this.accountForm.value.customerId;
          if (preselectedId) {
            this.onCustomerChange(preselectedId);
          }

          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          this.toastr.danger("Erreur lors du chargement des clients", "Erreur");
          console.error(error);
        },
      });
  }

  onCustomerSearch(searchTerm: string): void {
    const term = searchTerm?.toLowerCase() || "";

    if (!term) {
      this.filteredCustomers = [...this.customers];
      return;
    }

    this.filteredCustomers = this.customers.filter(
      (customer) =>
        customer.lastName.toLowerCase().includes(term) ||
        customer.firstName.toLowerCase().includes(term) ||
        customer.email.toLowerCase().includes(term)
    );
  }

  onCustomerChange(customerId: number): void {
    this.selectedCustomer =
      this.customers.find((c) => c.id === customerId) || null;
  }

  onSubmit(): void {
    if (this.accountForm.invalid) {
      this.markFormGroupTouched(this.accountForm);
      this.toastr.warning("Veuillez remplir tous les champs", "Attention");
      return;
    }

    this.isSubmitting = true;

    // Préparer les données selon le format exact de l'API
    // La devise XOF est ajoutée automatiquement
    const accountData: AccountRequest = {
      customerId: this.accountForm.value.customerId,
      accountType: this.accountForm.value.accountType,
      currency: this.CURRENCY, // Devise fixe XOF
    };

    this.accountApi
      .createAccount(accountData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (account) => {
          this.isSubmitting = false;
          this.toastr.success(
            `Compte ${this.getSelectedAccountType()?.label} créé avec succès`,
            "Succès"
          );
          this.router.navigate(["/pages/accounts/detail", account.id]);
        },
        error: (error) => {
          this.isSubmitting = false;

          if (error.status === 400) {
            // Erreur de validation (ex: client mineur pour compte courant)
            const errorMessage = error.error?.message || "Données invalides";
            this.toastr.warning(errorMessage, "Erreur de validation");
          } else if (error.status === 409) {
            this.toastr.warning(
              "Le client possède déjà un compte de ce type",
              "Conflit"
            );
          } else {
            this.toastr.danger(
              "Erreur lors de la création du compte",
              "Erreur"
            );
          }
        },
      });
  }

  onCancel(): void {
    this.router.navigate(["/pages/accounts"]);
  }

  get f() {
    return this.accountForm.controls;
  }

  getSelectedAccountType() {
    return this.accountTypes.find(
      (type) => type.value === this.f.accountType.value
    );
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  displayCustomerFn(customerId: number): string {
    const customer = this.customers.find((c) => c.id === customerId);
    return customer ? `${customer.lastName} ${customer.firstName}` : "";
  }
}