import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountApiService } from '../../../@core/data/api/index';
import { Account } from '../../../@core/data/models/index';
import { NbToastrService } from '@nebular/theme';

@Component({
  selector: 'ngx-account-detail',
  templateUrl: './account-detail.component.html'
})
export class AccountDetailComponent implements OnInit {
  account: Account | null = null;
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private accountApi: AccountApiService,
    private toastr: NbToastrService
  ) {}

  ngOnInit(): void {
    const accountId = +this.route.snapshot.params['id'];
    this.loadAccount(accountId);
  }

  private loadAccount(id: number): void {
    this.isLoading = true;

    this.accountApi.getAccountById(id).subscribe({
      next: (account) => {
        this.account = account;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.toastr.danger('Erreur lors du chargement du compte', 'Erreur');
        this.router.navigate(['/pages/accounts']);
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getAccountTypeLabel(type: string): string {
    return type === 'SAVINGS' ? 'Compte Épargne' : 'Compte Courant';
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'Actif';
      case 'BLOCKED': return 'Bloqué';
      case 'CLOSED': return 'Clos';
      default: return status;
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'BLOCKED': return 'danger';
      case 'CLOSED': return 'warning';
      default: return 'basic';
    }
  }

  generateStatement(): void {
    if (this.account) {
      this.router.navigate(['/pages/accounts/statement', this.account.id]);
    }
  }

  onBack(): void {
    this.router.navigate(['/pages/accounts']);
  }
}