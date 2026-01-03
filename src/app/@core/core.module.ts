import { NbCardModule, NbDialogModule } from '@nebular/theme';
import { NgModule, Optional, SkipSelf } from "@angular/core";
import { CommonModule } from "@angular/common";
import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { RouterModule } from "@angular/router";
import { ConfirmDialogComponent } from "./components/confirm-dialog.component";

// Importe les intercepteurs
import { JwtInterceptor } from "./data/interceptors/jwt.interceptor";
import { ErrorInterceptor } from "./data/interceptors/error.interceptor";

@NgModule({
  declarations: [ConfirmDialogComponent], // Déclarez le composant ici
  imports: [
    CommonModule,
    HttpClientModule, // ← ESSENTIEL pour les requêtes HTTP
    RouterModule, // ← Utile pour la navigation dans les intercepteurs
    NbCardModule,
    NbDialogModule.forRoot(), // ← Configure le module dialog au niveau du CoreModule
  ],
  providers: [
    // Intercepteurs HTTP (DOIVENT être déclarés ici)
    {
      provide: HTTP_INTERCEPTORS,
      useClass: JwtInterceptor,
      multi: true, // Permet plusieurs intercepteurs
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true,
    },
  ],
  exports: [ConfirmDialogComponent],
})
export class CoreModule {
  // Garantir que CoreModule n'est importé qu'une fois (dans AppModule)
  constructor(@Optional() @SkipSelf() parentModule?: CoreModule) {
    if (parentModule) {
      throw new Error(
        "CoreModule est déjà chargé. Importez-le uniquement dans AppModule."
      );
    }
  }
}
