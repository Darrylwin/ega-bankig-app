import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthApiService } from '../api/auth-api.service';

/**
 * Interceptor JWT
 * Ajoute automatiquement le token Bearer à chaque requête HTTP
 */
@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  
  constructor(private authService: AuthApiService) {}

  /**
   * Intercepte chaque requête HTTP
   */
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Récupère le token via le service AuthApiService
    const token = this.authService.getToken();

    // Si le token existe, on clone la requête et on ajoute le header Authorization
    if (token) {
      console.log('🔐 Adding JWT token to request:', request.url);
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    } else {
      console.warn('⚠️ No token found for request:', request.url);
    }

    // Continue avec la requête modifiée
    return next.handle(request);
  }
}