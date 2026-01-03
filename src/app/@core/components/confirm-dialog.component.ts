import { Component, Input } from "@angular/core";
import { NbDialogRef } from "@nebular/theme";

@Component({
  selector: "ngx-confirm-dialog",
  template: `
    <nb-card>
      <nb-card-header>{{ title }}</nb-card-header>
      <nb-card-body>
        <div [innerHTML]="message"></div>
      </nb-card-body>
      <nb-card-footer>
        <button nbButton status="basic" (click)="cancel()">
          {{ cancelText }}
        </button>
        <button nbButton [attr.status]="status" (click)="confirm()">
          {{ confirmText }}
        </button>
      </nb-card-footer>
    </nb-card>
  `,
  styles: [
    `
      nb-card {
        margin: 0;
        max-width: 500px;
      }

      nb-card-footer {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
      }
    `,
  ],
})
export class ConfirmDialogComponent {
  @Input() title: string = "Confirmation";
  @Input() message: string = "Êtes-vous sûr ?";
  @Input() confirmText: string = "Confirmer";
  @Input() cancelText: string = "Annuler";
  @Input() status: "primary" | "success" | "info" | "warning" | "danger" =
    "danger";

  constructor(protected ref: NbDialogRef<ConfirmDialogComponent>) {}

  cancel() {
    this.ref.close(false);
  }

  confirm() {
    this.ref.close(true);
  }
}
