import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

// Modules Nebular
import {
  NbCardModule,
  NbIconModule,
  NbButtonModule,
  NbButtonGroupModule, // ← VÉRIFIER ICI
  NbInputModule,
  NbSelectModule,
  NbDatepickerModule,
  NbSpinnerModule,
  NbAlertModule,
  NbDialogModule,
  NbTooltipModule,
  NbBadgeModule,
  NbTabsetModule,
  NbListModule,
  NbActionsModule,
  NbProgressBarModule,
} from "@nebular/theme";

// Tableau intelligent
import { Ng2SmartTableModule } from "ng2-smart-table";

// Charts
import { NgxChartsModule } from "@swimlane/ngx-charts";

import { CustomersRoutingModule } from "./customers-routing.module";
import { CustomersComponent } from "./customers.component";
import { CustomerFormComponent } from "./customer-form/customer-form.component";
import { CustomerDetailComponent } from "./customer-detail/customer-detail.component";

@NgModule({
  declarations:  [
    CustomersComponent,
    CustomerFormComponent,
    CustomerDetailComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CustomersRoutingModule,

    // Modules Nebular UI
    NbCardModule,
    NbIconModule,
    NbButtonModule,
    NbButtonGroupModule, // ← VÉRIFIER ICI
    NbInputModule,
    NbSelectModule,
    NbDatepickerModule,
    NbSpinnerModule,
    NbAlertModule,
    NbDialogModule. forChild(),
    NbTooltipModule,
    NbBadgeModule,
    NbTabsetModule,
    NbListModule,
    NbActionsModule,
    NbProgressBarModule,

    // Tableau intelligent
    Ng2SmartTableModule,

    // Charts
    NgxChartsModule,
  ],
})
export class CustomersModule {}