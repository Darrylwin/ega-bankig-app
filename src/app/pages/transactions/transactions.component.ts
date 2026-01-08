import { Component, OnInit, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
  selector: "ngx-transactions",
  templateUrl: "./transactions.component.html",
  styleUrls: ["./transactions.component.scss"],
})
export class TransactionsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Cartes des opérations
  operations = [
    {
      title: "Dépôt",
      description: "Ajouter des fonds",
      subtitle: "Créditer un compte bancaire",
      icon: "arrow-downward-outline",
      color: "success",
      route: "/pages/transactions/deposit",
      features: [
        "Espèces, chèque, virement",
        "Validation immédiate",
        "Reçu automatique",
        "Sans frais",
      ],
    },
    {
      title: "Retrait",
      description: "Retirer des fonds",
      subtitle: "Débiter un compte bancaire",
      icon: "arrow-upward-outline",
      color: "danger",
      route: "/pages/transactions/withdraw",
      features: [
        "Vérification solde",
        "Limites de sécurité",
        "Pièce d'identité requise",
        "Justificatif obligatoire",
      ],
    },
    {
      title: "Virement",
      description: "Transférer des fonds",
      subtitle: "Entre deux comptes",
      icon: "swap-outline",
      color: "primary",
      route: "/pages/transactions/transfer",
      features: [
        "Interne ou externe",
        "Immédiat ou différé",
        "Traçabilité complète",
        "Sécurisé",
      ],
    },
    {
      title: "Historique",
      description: "Consulter les transactions",
      subtitle: "Relevés et statistiques",
      icon: "list-outline",
      color: "info",
      route: "/pages/transactions/history",
      features: [
        "Recherche avancée",
        "Filtres par période",
        "Export PDF",
        "Statistiques détaillées",
      ],
    },
  ];

  isLoading = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Pas de chargement de données
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Navigation vers une opération
   */
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
