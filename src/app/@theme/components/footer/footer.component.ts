import { Component } from '@angular/core';

@Component({
  selector: 'ngx-footer',
  styleUrls: ['./footer.component.scss'],
  template: `
    <span class="created-by">
      Made by <b><a href="https://www.5minportfolio.dev/darryllogossou" target="_blank">Darrylwin LOGOSSOU</a></b>
    </span>
    <div class="socials">
      <a href="https://github.com/darrylwin" target="_blank" class="ion ion-social-github"></a>
      <a href="https://www.linkedin.com/in/darryl-win-logossou-04b5502a6" target="_blank" class="ion ion-social-linkedin"></a>
    </div>
  `,
})
export class FooterComponent {
}
