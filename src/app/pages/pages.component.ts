import { Component, OnInit } from '@angular/core';
import { MENU_ITEMS } from './pages-menu';
import { AuthApiService } from '../@core/data/api/auth-api.service';
import { NbMenuItem } from '@nebular/theme';

@Component({
  selector:  'ngx-pages',
  styleUrls: ['pages.component.scss'],
  template: `
    <ngx-one-column-layout>
      <nb-menu [items]="menu" [tag]="'main-menu'" autoCollapse="true"></nb-menu>
      <router-outlet></router-outlet>
    </ngx-one-column-layout>
  `,
})
export class PagesComponent implements OnInit {
  menu: NbMenuItem[] = MENU_ITEMS;
  currentUser: any;

  constructor(private authService: AuthApiService) {}

  ngOnInit(): void {
    // Récupérer l'utilisateur actuel
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.updateMenuBasedOnRole();
    });
  }

  /**
   * Met à jour le menu en fonction du rôle de l'utilisateur
   */
  private updateMenuBasedOnRole(): void {
    if (!this.currentUser) {
      return;
    }

    const roles = this.currentUser.roles || [];
    
    // Si l'utilisateur n'est pas admin, masquer certains éléments
    if (! roles.includes('admin') && !roles.includes('ROLE_ADMIN')) {
      this.menu = this.menu. filter(item => {
        // Filtrer les éléments réservés aux admins
        return item.title !== 'Statistiques';
      });
    }
  }
}