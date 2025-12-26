import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

/**
 * Service HTTP principal
 * Gère toutes les requêtes HTTP vers l'API backend
 * 
 * @Injectable({ providedIn: 'root' }) signifie que ce service est un Singleton
 * (une seule instance partagée dans toute l'application)
 */
@Injectable({
  providedIn: 'root',
})
export class ApiService {
  // URL de base de l'API (définie dans environment.ts)
  private readonly apiUrl = environment.apiUrl;

  /**
   * Le constructeur avec HttpClient injecté automatiquement par Angular
   * C'est l'équivalent de l'injection de dépendances en Spring Boot
   */
  constructor(private http: HttpClient) {}

  /**
   * GET request
   * @param path - Le chemin de l'endpoint (ex: '/customers')
   * @param params - Paramètres query optionnels (ex: { page: 0, size: 10 })
   */
  get<T>(path: string, params?: any): Observable<T> {
    // HttpParams permet de construire les query parameters
    let httpParams = new HttpParams();
    
    if (params) {
      // Parcourt chaque paramètre et l'ajoute à HttpParams
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }

    // Retourne un Observable (comme une Promise mais plus puissant)
    return this.http.get<T>(`${this.apiUrl}${path}`, { params: httpParams });
  }

  /**
   * POST request
   * @param path - Le chemin de l'endpoint
   * @param body - Le corps de la requête (les données à envoyer)
   */
  post<T>(path: string, body: any = {}): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}${path}`, body);
  }

  /**
   * PUT request
   * @param path - Le chemin de l'endpoint
   * @param body - Le corps de la requête
   */
  put<T>(path: string, body: any = {}): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}${path}`, body);
  }

  /**
   * DELETE request
   * @param path - Le chemin de l'endpoint
   */
  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}${path}`);
  }

  /**
   * GET request qui retourne un Blob (pour les fichiers PDF)
   * Utilisé pour télécharger les relevés bancaires
   */
  getBlob(path: string, params?: any): Observable<Blob> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }

    // responseType: 'blob' indique qu'on attend un fichier binaire
    return this.http.get(`${this.apiUrl}${path}`, {
      params: httpParams,
      responseType: 'blob',
    });
  }
}