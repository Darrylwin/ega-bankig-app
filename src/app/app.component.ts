import { Component, OnInit } from "@angular/core";
import { LoadingService } from "./@core/services/loading.service";
import { AuthApiService } from "./@core/data/api/auth-api.service";
import { Router } from "@angular/router";

@Component({
  selector: "ngx-app",
  template: `
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
    if (this.authService.isAuthenticated()) {
      // Token existe, on reste sur la page actuelle
      console.log('User is authenticated');
    }
  }
}