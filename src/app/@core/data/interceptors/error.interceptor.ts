import { Injectable } from "@angular/core";
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { Router } from "@angular/router";
import { NbToastrService } from "@nebular/theme";
import { AuthApiService } from "../api/auth-api.service";

/**
 * Interceptor pour gérer les erreurs HTTP globalement
 */
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private router: Router,
    private toastrService: NbToastrService, // Service de notifications de Nebular
    private authService: AuthApiService
  ) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = "Une erreur est survenue";

        if (error.error instanceof ErrorEvent) {
          // Erreur côté client
          errorMessage = `Erreur: ${error.error.message}`;
        } else {
          // Erreur côté serveur
          switch (error.status) {
            case 401:
              // Non authentifié - rediriger vers login
              errorMessage = "Session expirée. Veuillez vous reconnecter.";
              // Utiliser le service d'auth pour bien nettoyer l'état (token + user + sujets)
              try {
                this.authService.logout();
              } catch (e) {
                // Fallback si le service n'est pas disponible
                localStorage.removeItem("auth_token");
                localStorage.removeItem("current_user");
              }
              this.router.navigate(["/auth/login"]);
              break;
            case 403:
              errorMessage =
                "Accès refusé. Vous n'avez pas les droits nécessaires.";
              break;
            case 404:
              errorMessage = "Ressource non trouvée.";
              break;
            case 409:
              errorMessage =
                error.error?.message || "Conflit - la ressource existe déjà.";
              break;
            case 500:
              errorMessage = "Erreur serveur. Veuillez réessayer plus tard.";
              break;
            default:
              errorMessage = error.error?.message || `Erreur ${error.status}`;
          }
        }

        // Affiche la notification d'erreur
        this.toastrService.danger(errorMessage, "Erreur");

        // Retourne l'erreur pour que le composant puisse aussi la gérer
        return throwError(() => error);
      })
    );
  }
}
