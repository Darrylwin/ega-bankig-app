import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

// Modules Nebular
import { 
  NbCardModule, 
  NbIconModule, 
  NbButtonModule, 
  NbProgressBarModule,
  NbSpinnerModule,
  NbAlertModule,
  NbSelectModule,
  NbDatepickerModule
} from '@nebular/theme';

// Charts (optionnel - si tu veux des graphiques)
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { NgxEchartsModule } from 'ngx-echarts';

import { DashboardComponent } from './dashboard.component';

const routes: Routes = [
  {
    path: '',
    component: DashboardComponent
  }
];

@NgModule({
  declarations: [DashboardComponent],
  imports: [
    CommonModule,
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
    
    // Modules de graphiques (optionnel - installe-les si besoin)
    // NgxChartsModule,
    // NgxEchartsModule.forRoot({
    //   echarts: () => import('echarts')
    // }),
  ]
})
export class DashboardModule { }