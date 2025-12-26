import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { DashboardStats } from '../models';

/**
 * Service API pour les statistiques du dashboard
 */
@Injectable({
  providedIn: 'root',
})
export class DashboardApiService {

  constructor(private apiService: ApiService) {}

  /**
   * GET /api/dashboard/stats
   * Récupère toutes les statistiques pour le dashboard
   */
  getStats(): Observable<DashboardStats> {
    return this.apiService.get<DashboardStats>('/dashboard/stats');
  }
}