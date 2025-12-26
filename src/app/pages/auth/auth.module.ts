import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Modules Nebular
import { 
  NbAuthModule, 
  NbLoginComponent, 
  NbRegisterComponent, 
  NbLogoutComponent, 
  NbRequestPasswordComponent, 
  NbResetPasswordComponent 
} from '@nebular/auth';
import { 
  NbAlertModule, 
  NbButtonModule, 
  NbCardModule, 
  NbCheckboxModule, 
  NbIconModule, 
  NbInputModule, 
  NbLayoutModule, 
  NbSpinnerModule 
} from '@nebular/theme';

import { AuthRoutingModule } from './auth-routing.module';
import { LoginComponent } from './login/login.component';

@NgModule({
  declarations: [
    LoginComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AuthRoutingModule,
    
    // Modules Nebular UI
    NbAlertModule,
    NbButtonModule,
    NbCardModule,
    NbCheckboxModule,
    NbIconModule,
    NbInputModule,
    NbLayoutModule,
    NbSpinnerModule,
    
    // Module Auth Nebular (optionnel - on va créer notre propre login)
    // NbAuthModule.forRoot({
    //   strategies: [],
    //   forms: {},
    // }),
  ]
})
export class AuthModule { }