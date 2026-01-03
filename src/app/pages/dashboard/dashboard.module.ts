import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Routes } from "@angular/router";
import { FormsModule } from "@angular/forms";

// Modules Nebular
import {
  NbCardModule,
  NbIconModule,
  NbButtonModule,
  NbProgressBarModule,
  NbSpinnerModule,
  NbAlertModule,
  NbSelectModule,
  NbDatepickerModule,
  NbBadgeModule,
} from "@nebular/theme";

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
    RouterModule.forChild(routes),

    // Modules Nebular UI
    NbCardModule,
    NbIconModule,
    NbButtonModule,
    NbProgressBarModule,
    NbSpinnerModule,
    NbAlertModule,
    NbSelectModule,
    NbDatepickerModule,
    NbBadgeModule,
  ],
})
export class DashboardModule {}
