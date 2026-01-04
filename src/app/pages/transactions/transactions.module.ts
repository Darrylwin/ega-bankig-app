import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

// Modules Nebular
import {
  NbCardModule,
  NbIconModule, // ← VÉRIFIER ICI
  NbButtonModule,
  NbButtonGroupModule,
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
  NbRadioModule,
  NbCheckboxModule,
  NbStepperModule,
} from "@nebular/theme";

import { NbEvaIconsModule } from "@nebular/eva-icons"; // ← AJOUTER ICI

// Tableau intelligent
import { Ng2SmartTableModule } from "ng2-smart-table";

// Graphiques
import { NgxChartsModule } from "@swimlane/ngx-charts";

import { TransactionsRoutingModule } from "./transactions-routing.module";
import { TransactionsComponent } from "./transactions.component";
import { DepositComponent } from "./deposit/deposit.component";
import { WithdrawalComponent } from "./withdrawal/withdrawal.component";
import { TransferComponent } from "./transfer/transfer.component";
import { HistoryComponent } from "./history/history.component";

@NgModule({
  declarations: [
    TransactionsComponent,
    DepositComponent,
    WithdrawalComponent,
    TransferComponent,
    HistoryComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TransactionsRoutingModule,

    // Modules Nebular UI
    NbCardModule,
    NbIconModule, // ← VÉRIFIER ICI
    NbEvaIconsModule, // ← AJOUTER ICI
    NbButtonModule,
    NbButtonGroupModule,
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
    NbProgressBarModule,
    NbRadioModule,
    NbCheckboxModule,
    NbStepperModule,

    // Tableau intelligent
    Ng2SmartTableModule,

    // Graphiques
    NgxChartsModule,
  ],
})
export class TransactionsModule {}
