import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { NbToastrService } from "@nebular/theme";
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
export class AccountFormComponent implements OnInit {
  accountForm: FormGroup;
  isLoading = false;
  isSubmitting = false;

  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  selectedCustomer: Customer | null = null;

  // Options
  accountTypes = [
    {
      value: "SAVINGS",
      label: "Compte Épargne",
      icon: "trending-up-outline",
      description: "Idéal pour épargner avec un taux d'intérêt attractif",
      features: [
        "Taux d'intérêt:  2.0% par an",
        "Pas de frais de tenue de compte",
        "Capital garanti",
        "Virements gratuits",
      ],
      color: "success",
    },
    {
      value: "CURRENT",
      label: "Compte Courant",
      icon: "credit-card-outline",
      description: "Pour vos opérations bancaires quotidiennes",
      features: [
        "Découvert autorisé:  1 000 €",
        "Carte bancaire incluse",
        "Chéquier disponible",
        "Opérations illimitées",
      ],
      color: "primary",
    },
  ];

  currencies = [
    { value: "CFA", label: "Franc CFA (CFA)", symbol: "CFA", flag: "🇨🇫" },
    { value: "EUR", label: "Euro (€)", symbol: "€", flag: "🇪🇺" },
    { value: "USD", label: "Dollar ($)", symbol: "$", flag: "🇺🇸" },
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

  private createForm(): FormGroup {
    return this.fb.group({
      customerId: ["", [Validators.required]],
      accountType: ["SAVINGS", [Validators.required]],
      currency: ["EUR", [Validators.required]],
    });
  }

  private loadCustomers(): void {
    this.isLoading = true;

    this.customerApi
      .getCustomers({ page: 0, size: 1000, sort: "lastName,asc" })
      .subscribe({
        next: (response) => {
          this.customers = response.content;
          this.filteredCustomers = [...this.customers];
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          this.toastr.danger("Erreur lors du chargement des clients", "Erreur");
        },
      });
  }

  onCustomerSearch(event: any): void {
    const searchTerm = event?.toLowerCase() || "";

    if (!searchTerm) {
      this.filteredCustomers = [...this.customers];
      return;
    }

    this.filteredCustomers = this.customers.filter(
      (customer) =>
        customer.lastName.toLowerCase().includes(searchTerm) ||
        customer.firstName.toLowerCase().includes(searchTerm) ||
        customer.email.toLowerCase().includes(searchTerm)
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

    const accountData: AccountRequest = this.accountForm.value;

    this.accountApi.createAccount(accountData).subscribe({
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
          this.toastr.warning("Données invalides", "Erreur de validation");
        } else if (error.status === 409) {
          this.toastr.warning(
            "Le client possède déjà un compte de ce type",
            "Conflit"
          );
        } else {
          this.toastr.danger("Erreur lors de la création du compte", "Erreur");
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

  getSelectedCurrency() {
    return this.currencies.find((cur) => cur.value === this.f.currency.value);
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
    return customer
      ? `${customer.lastName} ${customer.firstName} - ${customer.email}`
      : "";
  }
}
