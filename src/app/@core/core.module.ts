import { NgModule, Optional, SkipSelf, ModuleWithProviders } from "@angular/core";
import { CommonModule } from "@angular/common";
import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { RouterModule } from "@angular/router";

// Components
import { ConfirmDialogComponent } from "./components/confirm-dialog.component";

// Intercepteurs
import { JwtInterceptor } from "./data/interceptors/jwt.interceptor";
import { ErrorInterceptor } from "./data/interceptors/error.interceptor";

// Services
import { LoadingService } from "./services/loading.service";
import { LayoutService } from "./utils/layout.service";
import { UserData } from "./data/users";
import { UsersService } from "./services/users.service";

// Modules Nebular nécessaires pour ConfirmDialogComponent
import { 
  NbCardModule, 
  NbButtonModule, 
  NbIconModule,
  NbBadgeModule 
} from "@nebular/theme";

@NgModule({
  declarations: [ConfirmDialogComponent],
  imports: [
    CommonModule,
    HttpClientModule,
    RouterModule,
    NbCardModule,
    NbButtonModule,
    NbIconModule,
    NbBadgeModule,
  ],
  exports: [ConfirmDialogComponent],
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule?:  CoreModule) {
    if (parentModule) {
      throw new Error(
        "CoreModule est déjà chargé.  Importez-le uniquement dans AppModule avec forRoot()."
      );
    }
  }

  static forRoot(): ModuleWithProviders<CoreModule> {
    return {
      ngModule: CoreModule,
      providers: [
        // Services globaux
        LoadingService,
        LayoutService,
        { provide: UserData, useClass: UsersService },
        
        // Intercepteurs HTTP
        {
          provide: HTTP_INTERCEPTORS,
          useClass: JwtInterceptor,
          multi: true,
        },
        {
          provide: HTTP_INTERCEPTORS,
          useClass:  ErrorInterceptor,
          multi: true,
        },
      ],
    };
  }
}