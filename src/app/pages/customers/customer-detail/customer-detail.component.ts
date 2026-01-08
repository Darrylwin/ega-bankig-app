import { Component, OnInit, OnDestroy } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { NbDialogService, NbToastrService } from "@nebular/theme";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import {
  CustomerApiService,
  AccountApiService,
} from "../../../@core/data/api/index";
import { Customer, Account } from "../../../@core/data/models/index";
import { ConfirmDialogComponent } from "../../../@core/components/confirm-dialog.component";

@Component({
  selector: "ngx-customer-detail",
  templateUrl: "./customer-detail.component.html",
  styleUrls: ["./customer-detail.component.scss"],
})
export class CustomerDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  customer: Customer | null = null;
  customerAccounts: Account[] = [];
  isLoading = false;
  isLoadingAccounts = false;

  // Statistiques du client
  customerStats = {
    totalAccounts: 0,
    savingsAccounts: 0,
    currentAccounts: 0,
    totalBalance: 0,
    averageBalance: 0,
    accountAge: 0,
    activeAccounts: 0,
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private customerApi: CustomerApiService,
    private accountApi: AccountApiService,
    private dialogService: NbDialogService,
    private toastr: NbToastrService
  ) {}

  ngOnInit(): void {
    const customerId = +this.route.snapshot.params["id"];
    if (customerId) {
      this.loadCustomerDetails(customerId);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charge tous les détails du client
   */
  loadCustomerDetails(customerId: number): void {
    this.isLoading = true;

    this.customerApi
      .getCustomerById(customerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (customer) => {
          this.customer = customer;
          this.isLoading = false;
          this.loadCustomerAccounts(customerId);
        },
        error: (error) => {
          this.isLoading = false;
          this.toastr.danger("Erreur lors du chargement du client", "Erreur");
          console.error(error);
        },
      });
  }

  /**
   * Charge les comptes du client
   */
  loadCustomerAccounts(customerId: number): void {
    this.isLoadingAccounts = true;

    this.accountApi
      .getAccountsByCustomerId(customerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (accounts) => {
          this.customerAccounts = accounts;
          this.calculateStats();
          this.isLoadingAccounts = false;
        },
        error: (error) => {
          this.isLoadingAccounts = false;
          console.error("Erreur chargement comptes:", error);
        },
      });
  }

  /**
   * Calcule les statistiques du client
   */
  calculateStats(): void {
    this.customerStats.totalAccounts = this.customerAccounts.length;
    this.customerStats.savingsAccounts = this.customerAccounts.filter(
      (a) => a.accountType === "SAVINGS"
    ).length;
    this.customerStats.currentAccounts = this.customerAccounts.filter(
      (a) => a.accountType === "CURRENT"
    ).length;
    this.customerStats.activeAccounts = this.customerAccounts.filter(
      (a) => a.status === "ACTIVE"
    ).length;

    this.customerStats.totalBalance = this.customerAccounts.reduce(
      (sum, a) => sum + (a.balance || 0),
      0
    );
    this.customerStats.averageBalance =
      this.customerStats.totalAccounts > 0
        ? this.customerStats.totalBalance / this.customerStats.totalAccounts
        : 0;

    if (this.customer) {
      const createdDate = new Date(this.customer.createdAt);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - createdDate.getTime());
      this.customerStats.accountAge = Math.ceil(
        diffTime / (1000 * 60 * 60 * 24)
      );
    }
  }

  /**
   * Actions
   */
  onEdit(): void {
    if (this.customer) {
      this.router.navigate(["/pages/customers/edit", this.customer.id]);
    }
  }

  onCreateAccount(): void {
    if (this.customer) {
      this.router.navigate(["/pages/accounts/new"], {
        queryParams: { customerId: this.customer.id },
      });
    }
  }

  onViewAccount(account: Account): void {
    this.router.navigate(["/pages/accounts/detail", account.id]);
  }

  onViewTransactions(): void {
    if (this.customer) {
      this.router.navigate(["/pages/transactions"], {
        queryParams: { customerId: this.customer.id },
      });
    }
  }

  onDelete(): void {
    if (!this.customer) return;

    this.dialogService
      .open(ConfirmDialogComponent, {
        context: {
          title: "Confirmer la suppression",
          message: `Êtes-vous sûr de vouloir supprimer <strong>${this.customer.firstName} ${this.customer.lastName}</strong> ?  <br><br>
            <small class="text-warning">Le client possède ${this.customerStats.totalAccounts} compte(s).</small><br>
            <small class="text-danger">Cette action est irréversible. </small>`,
          confirmText: "Supprimer",
          cancelText: "Annuler",
          status: "danger",
        },
      })
      .onClose.pipe(takeUntil(this.destroy$))
      .subscribe((confirmed) => {
        if (confirmed && this.customer) {
          this.deleteCustomer(this.customer.id);
        }
      });
  }

  deleteCustomer(id: number): void {
    this.customerApi
      .deleteCustomer(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastr.success("Client supprimé avec succès", "Succès");
          this.router.navigate(["/pages/customers"]);
        },
        error: (error) => {
          if (error.status === 409) {
            this.toastr.warning(
              "Impossible de supprimer un client avec des comptes actifs",
              "Attention"
            );
          } else {
            this.toastr.danger("Erreur lors de la suppression", "Erreur");
          }
        },
      });
  }

  onBack(): void {
    this.router.navigate(["/pages/customers"]);
  }

  /**
   * Helpers
   */
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  }

  formatAccountNumber(iban: string): string {
    return iban ? iban.match(/.{1,4}/g)?.join(" ") || iban : "";
  }

  formatNumber(num: number): string {
    return num?.toLocaleString("fr-FR") || "0";
  }

  getGenderLabel(gender: string): string {
    const labels: any = {
      MALE: "Homme",
      FEMALE: "Femme",
      OTHER: "Autre",
    };
    return labels[gender] || gender;
  }

  getGenderColor(gender: string): string {
    const colors: any = {
      MALE: "primary",
      FEMALE: "success",
      OTHER: "basic",
    };
    return colors[gender] || "basic";
  }

  getAccountTypeLabel(type: string): string {
    return type === "SAVINGS" ? "Compte Épargne" : "Compte Courant";
  }

  getAccountTypeIcon(type: string): string {
    return type === "SAVINGS" ? "trending-up-outline" : "credit-card-outline";
  }

  getStatusColor(status: string): string {
    const colors: any = {
      ACTIVE: "success",
      BLOCKED: "danger",
      CLOSED: "warning",
    };
    return colors[status] || "basic";
  }

  getStatusLabel(status: string): string {
    const labels: any = {
      ACTIVE: "Actif",
      BLOCKED: "Bloqué",
      CLOSED: "Clos",
    };
    return labels[status] || status;
  }
}
