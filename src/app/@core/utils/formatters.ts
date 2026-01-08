import { formatCurrency, formatDate } from '@angular/common';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FormatterService {
  formatCurrency(amount: number): string {
    // XOF does not have a minor unit, so no decimals
    return formatCurrency(amount, 'fr-FR', 'F CFA', 'XOF', '1.0-0');
  }

  formatDate(date: string | Date, format: string = 'dd/MM/yyyy'): string {
    return formatDate(date, format, 'fr-FR');
  }

  formatAccountNumber(iban: string): string {
    if (!iban) return '';
    // Format: FR76 3000 4000 0500 1234 5678 901
    return iban.replace(/(.{4})/g, '$1 ').trim();
  }
}