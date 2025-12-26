import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerApiService } from '../../../@core/data/api/index';
import { Customer } from '../../../@core/data/models/index';
import { NbToastrService } from '@nebular/theme';

@Component({
  selector: 'ngx-customer-detail',
  templateUrl: './customer-detail.component.html'
})
export class CustomerDetailComponent implements OnInit {
  customer: Customer | null = null;
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private customerApi: CustomerApiService,
    private toastr: NbToastrService
  ) {}

  ngOnInit(): void {
    const customerId = +this.route.snapshot.params['id'];
    this.loadCustomer(customerId);
  }

  private loadCustomer(id: number): void {
    this.isLoading = true;

    this.customerApi.getCustomerById(id).subscribe({
      next: (customer) => {
        this.customer = customer;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.toastr.danger('Erreur lors du chargement du client', 'Erreur');
        this.router.navigate(['/pages/customers']);
      }
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getGenderLabel(gender: string): string {
    switch (gender) {
      case 'MALE': return 'Homme';
      case 'FEMALE': return 'Femme';
      default: return 'Autre';
    }
  }

  onEdit(): void {
    if (this.customer) {
      this.router.navigate(['/pages/customers/edit', this.customer.id]);
    }
  }

  onBack(): void {
    this.router.navigate(['/pages/customers']);
  }
}