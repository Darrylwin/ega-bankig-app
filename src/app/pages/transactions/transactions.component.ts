import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'ngx-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss']
})
export class TransactionsComponent {
  
  // Cartes des opérations
  operations = [
    {
      title: 'Dépôt',
      description: 'Ajouter des fonds sur un compte',
      icon: 'trending-up-outline',
      color: 'success',
      route: '/pages/transactions/deposit',
      features: [
        'Espèces, chèque, virement',
        'Validation immédiate',
        'Reçu automatique'
      ]
    },
    {
      title: 'Retrait',
      description: 'Retirer des fonds d\'un compte',
      icon: 'trending-down-outline',
      color: 'danger',
      route: '/pages/transactions/withdraw',
      features: [
        'Vérification solde',
        'Limites de sécurité',
        'Justificatif obligatoire'
      ]
    },
    {
      title: 'Virement',
      description: 'Transférer entre deux comptes',
      icon: 'swap-horizontal-outline',
      color: 'primary',
      route: '/pages/transactions/transfer',
      features: [
        'Interne ou externe',
        'Immédiat ou différé',
        'Traçabilité complète'
      ]
    },
    {
      title: 'Historique',
      description: 'Consulter les transactions',
      icon: 'archive-outline',
      color: 'info',
      route: '/pages/transactions/history',
      features: [
        'Recherche avancée',
        'Filtres par période',
        'Export PDF/CSV'
      ]
    }
  ];

  // Statistiques rapides (pourrait venir d'une API)
  quickStats = [
    { label: 'Transactions Aujourd\'hui', value: '24', change: '+3' },
    { label: 'Dépôts du Jour', value: '€12,450', change: '+8%' },
    { label: 'Retraits du Jour', value: '€5,320', change: '-2%' },
    { label: 'Virements du Jour', value: '€7,130', change: '+12%' }
  ];

  // Transactions récentes (exemple)
  recentTransactions = [
    { type: 'deposit', account: 'FR76 3000 4000 0500 1234', amount: 1500, client: 'Jean Dupont', time: '10:30' },
    { type: 'withdrawal', account: 'FR76 3000 4000 0500 5678', amount: 300, client: 'Marie Martin', time: '11:15' },
    { type: 'transfer', account: 'FR76 3000 4000 0500 9012', amount: 750, client: 'Pierre Durand', time: '14:45' },
    { type: 'deposit', account: 'FR76 3000 4000 0500 3456', amount: 2200, client: 'Sophie Leroy', time: '16:20' }
  ];

  constructor(private router: Router) {}

  /**
   * Navigation vers une opération
   */
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  /**
   * Retourne l'icône selon le type de transaction
   */
  getTransactionIcon(type: string): string {
    switch(type) {
      case 'deposit': return 'trending-up-outline';
      case 'withdrawal': return 'trending-down-outline';
      case 'transfer': return 'swap-horizontal-outline';
      default: return 'repeat-outline';
    }
  }

  /**
   * Retourne la couleur selon le type
   */
  getTransactionColor(type: string): string {
    switch(type) {
      case 'deposit': return 'success';
      case 'withdrawal': return 'danger';
      case 'transfer': return 'primary';
      default: return 'basic';
    }
  }

  /**
   * Formate le montant
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }
}