import { Component, OnInit } from "@angular/core";
import { LoadingService } from "./@core/services/loading.service";
import { AuthApiService } from "./@core/data/api/auth-api.service";
import { Router } from "@angular/router";

@Component({
  selector: "ngx-app",
  template: `
    <!-- Indicateur de chargement global -->
    <ngx-loading *ngIf="loadingService.loading$ | async"></ngx-loading>

    <!-- Contenu principal -->
    <router-outlet></router-outlet>
  `,
})
export class AppComponent implements OnInit {
  constructor(
    public loadingService: LoadingService,
    private authService: AuthApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Vérifie si l'utilisateur est déjà connecté au démarrage
    this.checkAuthentication();
    
    // Écoute les changements d'URL pour gérer le loading
    this.setupRouterEvents();
  }

  private checkAuthentication(): void {
    if (this.authService.isAuthenticated()) {
      // Charge le profil utilisateur si token existe
      // this.authService.loadUserProfile();
    }
  }

  private setupRouterEvents(): void {
    // Tu peux ajouter ici des écouteurs d'événements du router
    // Par exemple pour montrer/cacher le loading pendant la navigation
  }
}