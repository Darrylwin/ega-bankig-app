// src/app/app.module.ts
import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

// Importe CoreModule
import { CoreModule } from "./@core/core.module";

// Modules Nebular
import { NbThemeModule, NbLayoutModule, NbToastrModule } from "@nebular/theme";
import { NbEvaIconsModule } from "@nebular/eva-icons";

import { AppComponent } from "./app.component";
import { AppRoutingModule } from "./app-routing.module";

@NgModule({
  declarations: [AppComponent],
  imports: [
    // Modules Angular essentiels
    BrowserModule,
    BrowserAnimationsModule,

    // CoreModule DOIT être importé ici
    CoreModule,

    // Modules Nebular
    NbThemeModule.forRoot({ name: "default" }),
    NbLayoutModule,
    NbEvaIconsModule,
    NbToastrModule.forRoot(),

    // Routing
    AppRoutingModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
