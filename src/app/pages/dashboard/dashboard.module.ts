import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Routes } from "@angular/router";
import { FormsModule } from "@angular/forms";

// Modules Nebular
import {
  NbCardModule,
  NbIconModule,
  NbButtonModule,
  NbButtonGroupModule, // ← AJOUT ICI
  NbProgressBarModule,
  NbSpinnerModule,
  NbAlertModule,
  NbSelectModule,
  NbDatepickerModule,
  NbBadgeModule,
  NbTabsetModule,
  NbTooltipModule, // ← AJOUT pour les tooltips
} from "@nebular/theme";

// Charts
import { NgxChartsModule } from "@swimlane/ngx-charts";

import { DashboardComponent } from "./dashboard.component";

const routes: Routes = [
  {
    path: "",
    component: DashboardComponent,
  },
];

@NgModule({
  declarations: [DashboardComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule. forChild(routes),

    // Modules Nebular UI
    NbCardModule,
    NbIconModule,
    NbButtonModule,
    NbButtonGroupModule, // ← AJOUT ICI
    NbProgressBarModule,
    NbSpinnerModule,
    NbAlertModule,
    NbSelectModule,
    NbDatepickerModule,
    NbBadgeModule,
    NbTabsetModule,
    NbTooltipModule, // ← AJOUT ICI

    // Charts
    NgxChartsModule,
  ],
})
export class DashboardModule {}