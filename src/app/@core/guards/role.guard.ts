import { Injectable } from '@angular/core';
import { 
  CanActivate, 
  ActivatedRouteSnapshot, 
  RouterStateSnapshot,
  Router 
} from '@angular/router';
import { AuthApiService } from '../data/api/auth-api.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthApiService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const expectedRoles = route.data['roles'] as string[];
    
    if (!expectedRoles || expectedRoles.length === 0) {
      return true; // Pas de restriction de rôle
    }

    const userRoles = this.authService.getCurrentUser()?.roles || [];
    const hasRole = expectedRoles.some(role => userRoles.includes(role));

    if (!hasRole) {
      this.router.navigate(['/pages/access-denied']);
      return false;
    }

    return true;
  }
}