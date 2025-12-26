import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccountsComponent } from './accounts.component';
import { AccountFormComponent } from './account-form/account-form.component';
import { AccountDetailComponent } from './account-detail/account-detail.component';
import { AccountStatementComponent } from './account-statement/account-statement.component';

const routes: Routes = [
  {
    path: '',
    component: AccountsComponent
  },
  {
    path: 'new',
    component: AccountFormComponent,
    data: { mode: 'create' }
  },
  {
    path: 'detail/:id',
    component: AccountDetailComponent
  },
  {
    path: 'statement/:id',
    component: AccountStatementComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AccountsRoutingModule { }