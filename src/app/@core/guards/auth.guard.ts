import { Injectable } from '@angular/core';
import { 
  CanActivate, 
  CanActivateChild, 
  Router, 
  ActivatedRouteSnapshot, 
  RouterStateSnapshot 
} from '@angular/router';
import { AuthApiService } from '../data/api/auth-api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(
    private authService: AuthApiService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    return this.checkAuth(state.url);
  }

  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    return this.canActivate(route, state);
  }

  private checkAuth(url: string): boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    }
    
    // Redirige vers login si non authentifié
    this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl: url }
    });
    return false;
  }
}