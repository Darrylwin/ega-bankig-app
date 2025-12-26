import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Routes } from "@angular/router";

// Importe les modules de chaque page
import { DashboardModule } from "./dashboard/dashboard.module";
import { CustomersModule } from "./customers/customers.module";
import { AccountsModule } from "./accounts/accounts.module";
import { TransactionsModule } from "./transactions/transactions.module";

// Routes INTERNES aux pages
const routes: Routes = [
  {
    path: "",
    redirectTo: "dashboard",
    pathMatch: "full",
  },
  {
    path: "dashboard",
    loadChildren: () =>
      import("./dashboard/dashboard.module").then((m) => m.DashboardModule),
  },
  {
    path: "customers",
    loadChildren: () =>
      import("./customers/customers.module").then((m) => m.CustomersModule),
  },
  {
    path: "accounts",
    loadChildren: () =>
      import("./accounts/accounts.module").then((m) => m.AccountsModule),
  },
  {
    path: "transactions",
    loadChildren: () =>
      import("./transactions/transactions.module").then(
        (m) => m.TransactionsModule
      ),
  },
];

@NgModule({
  declarations: [], // Pas de déclarations ici
  imports: [
    CommonModule,
    RouterModule.forChild(routes), // ← Routes enfants

    // Importe tous les modules de pages
    DashboardModule,
    CustomersModule,
    AccountsModule,
    TransactionsModule,
  ],
  exports: [RouterModule],
})
export class PagesModule {}
