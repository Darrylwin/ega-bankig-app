import { Component } from '@angular/core';
import { NbDialogRef } from '@nebular/theme';

@Component({
  selector: 'ngx-confirm-dialog',
  template: `
    <nb-card>
      <nb-card-header>{{ title }}</nb-card-header>
      <nb-card-body>
        <p>{{ message }}</p>
      </nb-card-body>
      <nb-card-footer class="d-flex justify-content-end gap-2">
        <button nbButton status="basic" (click)="cancel()">
          {{ cancelText || 'Annuler' }}
        </button>
        <button nbButton [status]="status || 'primary'" (click)="confirm()">
          {{ confirmText || 'Confirmer' }}
        </button>
      </nb-card-footer>
    </nb-card>
  `,
  styles: [`
    nb-card {
      min-width: 400px;
      max-width: 500px;
    }
    nb-card-body p {
      margin: 0;
    }
  `]
})
export class ConfirmDialogComponent {
  title = '';
  message = '';
  confirmText = '';
  cancelText = '';
  status = 'primary';

  constructor(protected dialogRef: NbDialogRef<ConfirmDialogComponent>) {}

  cancel(): void {
    this.dialogRef.close(false);
  }

  confirm(): void {
    this.dialogRef.close(true);
  }
}