import { NbCardModule, NbDialogModule, NbButtonModule } from "@nebular/theme";
import { NgModule, Optional, SkipSelf } from "@angular/core";
import { CommonModule } from "@angular/common";
import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { RouterModule } from "@angular/router";
import { ConfirmDialogComponent } from "./components/confirm-dialog.component";

// Importe les intercepteurs
import { JwtInterceptor } from "./data/interceptors/jwt.interceptor";
import { ErrorInterceptor } from "./data/interceptors/error.interceptor";

@NgModule({
  declarations: [ConfirmDialogComponent],
  imports: [
    CommonModule,
    HttpClientModule,
    RouterModule,
    NbCardModule,
    NbButtonModule,
    NbDialogModule.forRoot(),
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: JwtInterceptor,
      multi: true,
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
  constructor(@Optional() @SkipSelf() parentModule?: CoreModule) {
    if (parentModule) {
      throw new Error(
        "CoreModule est déjà chargé. Importez-le uniquement dans AppModule."
      );
    }
  }
}
