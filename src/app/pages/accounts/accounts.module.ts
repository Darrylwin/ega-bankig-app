import { CoreModule } from './../../@core/core.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

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
  NbProgressBarModule,
  NbRadioModule,
  NbCheckboxModule
} from '@nebular/theme';

// Tableau intelligent
import { Ng2SmartTableModule } from 'ng2-smart-table';

import { AccountsRoutingModule } from './accounts-routing.module';
import { AccountsComponent } from './accounts.component';
import { AccountFormComponent } from './account-form/account-form.component';
import { AccountDetailComponent } from './account-detail/account-detail.component';
import { AccountStatementComponent } from './account-statement/account-statement.component';

@NgModule({
  declarations: [
    AccountsComponent,
    AccountFormComponent,
    AccountDetailComponent,
    AccountStatementComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AccountsRoutingModule,
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
    NbProgressBarModule,
    NbRadioModule,
    NbCheckboxModule,
    
    // Tableau intelligent
    Ng2SmartTableModule
  ]
})
export class AccountsModule { }