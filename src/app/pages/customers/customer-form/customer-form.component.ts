import { Component, OnInit, OnDestroy } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { NbToastrService } from "@nebular/theme";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { CustomerRequest, Customer } from "../../../@core/data/models/index";
import { CustomerApiService } from "../../../@core/data/api/index";

@Component({
  selector: "ngx-customer-form",
  templateUrl: "./customer-form.component.html",
  styleUrls: ["./customer-form.component.scss"],
})
export class CustomerFormComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  customerForm: FormGroup;
  isEditMode = false;
  customerId: number | null = null;
  isLoading = false;
  isSubmitting = false;

  today: string = "";

  // Options
  genderOptions = [
    { value: "MALE", label: "Homme", icon: "person-outline", color: "primary" },
    {
      value: "FEMALE",
      label: "Femme",
      icon: "person-outline",
      color: "success",
    },
    { value: "OTHER", label: "Autre", icon: "person-outline", color: "basic" },
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private customerApi: CustomerApiService,
    private toastr: NbToastrService
  ) {
    this.customerForm = this.createForm();
  }

  ngOnInit(): void {
    this.today = this.formatDateForInput(new Date());

    const mode = this.route.snapshot.data["mode"];
    this.isEditMode = mode === "edit";

    if (this.isEditMode) {
      this.customerId = +this.route.snapshot.params["id"];
      if (this.customerId) {
        this.loadCustomerData();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Crée le formulaire - SIMPLIFIÉ (uniquement les champs requis par l'API)
   */
  private createForm(): FormGroup {
    return this.fb.group({
      lastName: [
        "",
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
        ],
      ],
      firstName: [
        "",
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
        ],
      ],
      dateOfBirth: ["", [Validators.required]],
      gender: ["MALE", [Validators.required]],
      address: ["", [Validators.required]],
      phoneNumber: [
        "",
        [Validators.required, Validators.pattern(/^\+[1-9]\d{1,14}$/)],
      ],
      email: [
        "",
        [Validators.required, Validators.email],
      ],
      nationality: ["", [Validators.required]],
    });
  }

  /**
   * Charge les données du client (mode édition)
   */
  private loadCustomerData(): void {
    if (!this.customerId) return;

    this.isLoading = true;

    this.customerApi
      .getCustomerById(this.customerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (customer: Customer) => {
          // Formater la date pour l'input date
          const formattedDate = customer.dateOfBirth.split("T")[0];

          this.customerForm.patchValue({
            lastName: customer.lastName,
            firstName: customer.firstName,
            dateOfBirth: formattedDate,
            gender: customer.gender,
            address: customer.address,
            phoneNumber: customer.phoneNumber,
            email: customer.email,
            nationality: customer.nationality,
          });

          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          this.toastr.danger("Erreur lors du chargement du client", "Erreur");
          this.router.navigate(["/pages/customers"]);
        },
      });
  }

  /**
   * Soumission du formulaire
   */
  onSubmit(): void {
    if (this.customerForm.invalid) {
      this.markFormGroupTouched(this.customerForm);
      this.toastr.warning(
        "Veuillez remplir tous les champs correctement",
        "Attention"
      );
      return;
    }

    this.isSubmitting = true;

    // Préparer les données selon le format exact de l'API
    const customerData: CustomerRequest = {
      lastName: this.customerForm.value.lastName,
      firstName: this.customerForm.value.firstName,
      dateOfBirth: this.customerForm.value.dateOfBirth, // Format YYYY-MM-DD
      gender: this.customerForm.value.gender,
      address: this.customerForm.value.address,
      phoneNumber: this.customerForm.value.phoneNumber,
      email: this.customerForm.value.email,
      nationality: this.customerForm.value.nationality,
    };

    if (this.isEditMode && this.customerId) {
      this.updateCustomer(customerData);
    } else {
      this.createCustomer(customerData);
    }
  }

  /**
   * Crée un nouveau client
   */
  private createCustomer(data: CustomerRequest): void {
    this.customerApi
      .createCustomer(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (customer) => {
          this.isSubmitting = false;
          this.toastr.success(
            `Client ${customer.firstName} ${customer.lastName} créé avec succès`,
            "Succès"
          );
          this.router.navigate(["/pages/customers/detail", customer.id]);
        },
        error: (error) => {
          this.isSubmitting = false;

          if (error.status === 409) {
            this.toastr.warning(
              "Un client avec cet email ou ce téléphone existe déjà",
              "Attention"
            );
          } else {
            this.toastr.danger(
              "Erreur lors de la création du client",
              "Erreur"
            );
          }
        },
      });
  }

  /**
   * Met à jour un client existant
   */
  private updateCustomer(data: CustomerRequest): void {
    if (!this.customerId) return;

    this.customerApi
      .updateCustomer(this.customerId, data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (customer) => {
          this.isSubmitting = false;
          this.toastr.success(
            `Client ${customer.firstName} ${customer.lastName} mis à jour`,
            "Succès"
          );
          this.router.navigate(["/pages/customers/detail", customer.id]);
        },
        error: (error) => {
          this.isSubmitting = false;
          this.toastr.danger(
            "Erreur lors de la mise à jour du client",
            "Erreur"
          );
        },
      });
  }

  /**
   * Annule et retourne à la liste
   */
  onCancel(): void {
    if (this.isEditMode && this.customerId) {
      this.router.navigate(["/pages/customers/detail", this.customerId]);
    } else {
      this.router.navigate(["/pages/customers"]);
    }
  }

  /**
   * Marque tous les champs comme touchés
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Raccourci pour accéder aux contrôles
   */
  get f() {
    return this.customerForm.controls;
  }

  /**
   * Calcule l'âge - UTILE pour l'affichage uniquement
   */
  calculateAge(): number {
    if (!this.customerForm.value.dateOfBirth) return 0;

    const birthDate = new Date(this.customerForm.value.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age >= 0 ? age : 0;
  }

  /**
   * Vérifie si le client est majeur
   */
  isAdult(): boolean {
    return this.calculateAge() >= 18;
  }

  /**
   * Helpers
   */
  formatDateForInput(date: Date): string {
    return date.toISOString().split("T")[0];
  }
}