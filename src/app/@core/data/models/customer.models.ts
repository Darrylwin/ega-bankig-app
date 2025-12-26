import { Gender } from './common.models';

/**
 * Client (Customer)
 * Structure complète reçue du backend
 */
export interface Customer {
  id: number;
  lastName: string;
  firstName: string;
  dateOfBirth: string;        // Format ISO: "1990-05-15"
  gender: Gender;
  address: string;
  phoneNumber: string;
  email: string;
  nationality: string;
  createdAt: string;          // Format ISO: "2026-01-18T10:30:00"
  age: number;
}

/**
 * Requête de création/modification d'un client
 * Envoyé à POST /api/customers ou PUT /api/customers/{id}
 */
export interface CustomerRequest {
  lastName: string;
  firstName: string;
  dateOfBirth: string;
  gender: Gender;
  address: string;
  phoneNumber: string;
  email: string;
  nationality: string;
}