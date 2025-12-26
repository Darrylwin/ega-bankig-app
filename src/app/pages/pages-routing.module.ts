import { RouterModule, Routes } from "@angular/router";
import { NgModule } from "@angular/core";
import { PagesComponent } from "./pages.component";

const routes: Routes = [
  {
    path: "",
    component: PagesComponent,
    children: [
      // DASHBOARD - Page principale
      {
        path: 'dashboard',
        loadChildren: () => import('./dashboard/dashboard.module')
          .then(m => m.DashboardModule),
      },

      // GESTION CLIENTS
      {
        path: "customers",
        loadChildren: () =>
          import("./customers/customers.module").then((m) => m.CustomersModule),
      },

      // GESTION COMPTES
      {
        path: "accounts",
        loadChildren: () =>
          import("./accounts/accounts.module").then((m) => m.AccountsModule),
      },

      // TRANSACTIONS
      {
        path: "transactions",
        loadChildren: () =>
          import("./transactions/transactions.module").then(
            (m) => m.TransactionsModule
          ),
      },

      // AUTHENTIFICATION (gardé pour les pages de profil, etc.)
      {
        path: 'auth',
        loadChildren: () => import('./auth/auth.module')
          .then(m => m.AuthModule),
      },

      // PAGES DIVERSES (404, aide, etc.)
      {
        path: "miscellaneous",
        loadChildren: () =>
          import("./miscellaneous/miscellaneous.module").then(
            (m) => m.MiscellaneousModule
          ),
      },

      // REDIRECTION PAR DÉFAUT
      {
        path: "",
        redirectTo: "dashboard",
        pathMatch: "full",
      },

      // PAGE 404
      {
        path: "**",
        loadChildren: () =>
          import("./miscellaneous/miscellaneous.module").then(
            (m) => m.MiscellaneousModule
          ),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PagesRoutingModule {}
