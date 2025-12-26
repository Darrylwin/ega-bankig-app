import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Interceptor JWT
 * Ajoute automatiquement le token Bearer à chaque requête HTTP
 */
@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  /**
   * Intercepte chaque requête HTTP
   */
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Récupère le token du localStorage
    const token = localStorage.getItem('token');

    // Si le token existe, on clone la requête et on ajoute le header Authorization
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    // Continue avec la requête modifiée
    return next.handle(request);
  }
}