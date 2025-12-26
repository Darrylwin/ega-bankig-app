import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Customer, CustomerRequest, Page, PaginationParams } from '../models';

/**
 * Service API pour la gestion des clients
 * CRUD complet sur les clients
 */
@Injectable({
  providedIn: 'root',
})
export class CustomerApiService {

  constructor(private apiService: ApiService) {}

  /**
   * GET /api/customers (avec pagination)
   * Récupère la liste paginée des clients
   * 
   * @param params - Paramètres de pagination { page, size, sort }
   * @returns Une page de clients
   */
  getCustomers(params: PaginationParams): Observable<Page<Customer>> {
    // Construit les query params
    const queryParams: any = {
      page: params.page,
      size: params.size,
    };

    // Ajoute le sort si présent
    if (params.sort) {
      // Split "lastName,asc" en ["lastName", "asc"]
      queryParams.sort = params.sort;
    }

    return this.apiService.get<Page<Customer>>('/customers', queryParams);
  }

  /**
   * GET /api/customers/{id}
   * Récupère un client par son ID
   */
  getCustomerById(id: number): Observable<Customer> {
    return this.apiService.get<Customer>(`/customers/${id}`);
  }

  /**
   * POST /api/customers
   * Crée un nouveau client
   */
  createCustomer(customer: CustomerRequest): Observable<Customer> {
    return this.apiService.post<Customer>('/customers', customer);
  }

  /**
   * PUT /api/customers/{id}
   * Met à jour un client existant
   */
  updateCustomer(id: number, customer: CustomerRequest): Observable<Customer> {
    return this.apiService.put<Customer>(`/customers/${id}`, customer);
  }

  /**
   * DELETE /api/customers/{id}
   * Supprime un client
   */
  deleteCustomer(id: number): Observable<void> {
    return this.apiService.delete<void>(`/customers/${id}`);
  }

  /**
   * GET /api/customers/email/{email}
   * Recherche un client par son email
   */
  getCustomerByEmail(email: string): Observable<Customer> {
    return this.apiService.get<Customer>(`/customers/email/${email}`);
  }
}