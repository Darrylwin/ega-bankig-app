import { Component, OnInit } from "@angular/core";
import { LoadingService } from "./@core/services/loading.service";
import { AuthApiService } from "./@core/data/api/auth-api.service";
import { Router, NavigationEnd } from "@angular/router";
import { filter } from "rxjs/operators";

@Component({
  selector: "ngx-app",
  template: `<router-outlet></router-outlet>`,
})
export class AppComponent implements OnInit {
  constructor(
    public loadingService: LoadingService,
    private authService: AuthApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // SUPPRIME LE SPINNER INITIAL
    this.removeInitialSpinner();

    // NE REDIRIGE PAS SI DÉJÀ AUTHENTIFIÉ
    // Le AuthGuard s'occupera de la redirection

    // Écoute les changements de route pour déboguer
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        console.log("🔄 Navigation to:", event.url);
      });
  }

  /**
   * SUPPRIME LE SPINNER INITIAL DE index.html
   */
  private removeInitialSpinner(): void {
    const spinner = document.getElementById("nb-global-spinner");
    if (spinner) {
      spinner.remove();
      console.log("🗑️ Initial spinner removed");
    }
  }
}
