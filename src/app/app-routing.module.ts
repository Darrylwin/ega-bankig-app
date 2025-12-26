import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './@core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'pages/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./pages/auth/auth.module')
      .then(m => m.AuthModule)
  },
  {
    path: 'pages',
    canActivate: [AuthGuard], // PROTÉGÉ PAR AUTH GUARD
    loadChildren: () => import('./pages/pages.module')
      .then(m => m.PagesModule)
  },
  {
    path: '**',
    redirectTo: 'auth/login'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }