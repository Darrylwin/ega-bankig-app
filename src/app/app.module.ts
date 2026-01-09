import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { HttpClientModule } from "@angular/common/http";
import { NbEvaIconsModule } from "@nebular/eva-icons"; // <-- AJOUTEZ CE MODULE

import { CoreModule } from "./@core/core.module";

// Modules Nebular
import { 
  NbThemeModule, 
  NbLayoutModule, 
  NbToastrModule,
  NbMenuModule,
  NbSidebarModule,
  NbActionsModule,
  NbContextMenuModule,
  NbUserModule,
  NbSearchModule,
} from "@nebular/theme";
import { NbSecurityModule, NbRoleProvider } from "@nebular/security";

import { AppComponent } from "./app.component";
import { AppRoutingModule } from "./app-routing.module";

/**
 * CONFIGURATION DU ROLE PROVIDER
 */
export class RoleProvider extends NbRoleProvider {
  getRole() {
    // Retourne le rôle de l'utilisateur depuis le localStorage
    const user = localStorage.getItem('current_user');
    if (user) {
      const userData = JSON.parse(user);
      return userData.roles || ['guest'];
    }
    return ['guest'];
  }
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    // Modules Angular essentiels
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,

    // CoreModule
    CoreModule.forRoot(),

    // Modules Nebular (TOUS avec forRoot())
    NbThemeModule.forRoot({ name: "default" }),
    NbLayoutModule,
    NbEvaIconsModule,
    NbToastrModule.forRoot(),
    NbMenuModule.forRoot(),
    NbSidebarModule.forRoot(),
    NbActionsModule,
    NbContextMenuModule,
    NbUserModule,
    NbSearchModule,
    
    // NbSecurityModule avec configuration des rôles
    NbSecurityModule.forRoot({
      accessControl: {
        guest: {
          view: '*',
        },
        user: {
          parent: 'guest',
          create: '*',
          edit: '*',
          remove: '*',
        },
        admin: {
          parent: 'user',
          create: '*',
          edit: '*',
          remove: '*',
        },
      },
    }),

    // Routing (TOUJOURS en dernier)
    AppRoutingModule,
  ],
  providers: [
    // Fournir le RoleProvider
    { provide: NbRoleProvider, useClass: RoleProvider },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}