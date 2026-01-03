import { Component, Input } from '@angular/core';
import { NbDialogRef } from '@nebular/theme';

@Component({
  selector: 'ngx-confirm-dialog',
  template: `
    <nb-card>
      <nb-card-header>{{ title }}</nb-card-header>
      <nb-card-body>
        {{ message }}
      </nb-card-body>
      <nb-card-footer>
        <button nbButton status="basic" (click)="cancel()">
          Annuler
        </button>
        <button nbButton status="danger" (click)="confirm()">
          Confirmer
        </button>
      </nb-card-footer>
    </nb-card>
  `,
  styles: [`
    nb-card-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
    }
  `]
})
export class ConfirmDialogComponent {
  @Input() title: string = 'Confirmation';
  @Input() message: string = 'Êtes-vous sûr ? ';

  constructor(protected ref: NbDialogRef<ConfirmDialogComponent>) {}

  cancel() {
    this.ref.close(false);
  }

  confirm() {
    this.ref.close(true);
  }
}