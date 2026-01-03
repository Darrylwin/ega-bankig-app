import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

// Modules Nebular
import {
  NbCardModule,
  NbIconModule,
  NbButtonModule,
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
} from "@nebular/theme";

// Tableau intelligent
import { Ng2SmartTableModule } from "ng2-smart-table";

import { CustomersRoutingModule } from "./customers-routing.module";
import { CustomersComponent } from "./customers.component";
import { CustomerFormComponent } from "./customer-form/customer-form.component";
import { CustomerDetailComponent } from "./customer-detail/customer-detail.component";
import { CoreModule } from "./../../@core/core.module";

@NgModule({
  declarations: [
    CustomersComponent,
    CustomerFormComponent,
    CustomerDetailComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CustomersRoutingModule,
    CoreModule,

    // Modules Nebular UI
    NbCardModule,
    NbIconModule,
    NbButtonModule,
    NbInputModule,
    NbSelectModule,
    NbDatepickerModule,
    NbSpinnerModule,
    NbAlertModule,
    NbDialogModule.forChild(),
    NbTooltipModule,
    NbBadgeModule,
    NbTabsetModule,
    NbListModule,
    NbActionsModule,

    // Tableau intelligent
    Ng2SmartTableModule,
  ],
})
export class CustomersModule {}
