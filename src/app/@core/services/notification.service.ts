import { Injectable } from '@angular/core';
import { NbToastrService } from '@nebular/theme';
import { Router } from '@angular/router';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(
    private toastrService: NbToastrService,
    private router: Router
  ) {}

  show(type: NotificationType, title: string, message?: string) {
    this.toastrService.show(message || '', title, {
      status: type,
      duration: 3000,
      preventDuplicates: true
    });
  }

  success(title: string, message?: string) {
    this.show('success', title, message);
  }

  error(title: string, message?: string) {
    this.show('error', title, message);
  }

  apiError(error: any) {
    let message = 'Une erreur est survenue';
    
    if (error.error?.message) {
      message = error.error.message;
    } else if (error.message) {
      message = error.message;
    }
    
    this.error('Erreur API', message);
  }
}