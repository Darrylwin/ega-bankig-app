import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AuthGuard } from "./@core/guards/auth.guard";

const routes: Routes = [
  {
    path: "",
    redirectTo: "pages/dashboard", // Redirige vers dashboard par défaut
    pathMatch: "full",
  },
  {
    path: "auth",
    loadChildren: () =>
      import("./pages/auth/auth.module").then((m) => m.AuthModule),
  },
  {
    path: "pages",
    canActivate: [AuthGuard], // ← PROTECTION AUTH POUR TOUTES LES PAGES ADMIN
    loadChildren: () =>
      import("./pages/pages.module").then((m) => m.PagesModule),
  },
  {
    path: "**",
    redirectTo: "pages/dashboard", // Redirection pour routes inconnues
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
