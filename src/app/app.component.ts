import { Component, OnInit } from "@angular/core";
import { LoadingService } from "./@core/services/loading.service";

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
  constructor(public loadingService: LoadingService) {}
}
