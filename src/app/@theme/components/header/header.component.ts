import { Component, OnDestroy, OnInit } from '@angular/core';
import { 
  NbMediaBreakpointsService, 
  NbMenuService, 
  NbSidebarService, 
  NbThemeService 
} from '@nebular/theme';
import { Router } from '@angular/router';
import { AuthApiService } from '../../../@core/data/api/auth-api.service';
import { LayoutService } from '../../../@core/utils/layout.service';
import { map, takeUntil, filter } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector:  'ngx-header',
  styleUrls: ['./header.component.scss'],
  templateUrl: './header.component.html',
})
export class HeaderComponent implements OnInit, OnDestroy {
  private destroy$: Subject<void> = new Subject<void>();
  userPictureOnly: boolean = false;
  user: any;

  themes = [
    { value: 'default', name:  'Light' },
    { value: 'dark', name:  'Dark' },
    // { value: 'cosmic', name:  'Cosmic' },
  ];

  currentTheme = 'default';
  userMenu = [
    { title: 'Changer mot de passe' },
    { title: 'Déconnexion' }
  ];

  constructor(
    private sidebarService: NbSidebarService,
    private menuService: NbMenuService,
    private themeService: NbThemeService,
    private authService: AuthApiService,
    private router: Router,
    private layoutService: LayoutService,
    private breakpointService: NbMediaBreakpointsService
  ) {}

  ngOnInit() {
    this.currentTheme = this.themeService.currentTheme;

    // Récupérer l'utilisateur connecté
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        if (user) {
          this.user = {
            name: user.username,
            picture: 'assets/images/avatar.png'
          };
        }
      });

    // Gérer les clics sur le menu utilisateur
    this.menuService.onItemClick()
      .pipe(
        filter(({ tag }) => tag === 'user-context-menu'),
        takeUntil(this.destroy$)
      )
      .subscribe((event) => {
        if (event.item.title === 'Déconnexion') {
          this.logout();
        } else if (event.item.title === 'Changer mot de passe') {
          this.changePassword();
        }
      });

    const { xl } = this.breakpointService.getBreakpointsMap();
    this.themeService.onMediaQueryChange()
      .pipe(
        map(([, currentBreakpoint]) => currentBreakpoint.width < xl),
        takeUntil(this.destroy$),
      )
      .subscribe((isLessThanXl: boolean) => this.userPictureOnly = isLessThanXl);

    this.themeService.onThemeChange()
      .pipe(
        map(({ name }) => name),
        takeUntil(this.destroy$),
      )
      .subscribe(themeName => this.currentTheme = themeName);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  changeTheme(themeName: string) {
    this.themeService.changeTheme(themeName);
  }

  toggleSidebar(): boolean {
    this.sidebarService. toggle(true, 'menu-sidebar');
    this.layoutService.changeLayoutSize();
    return false;
  }

  navigateHome() {
    this.menuService.navigateHome();
    return false;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  changePassword() {
    this.router.navigate(['/auth/change-password']);
  }
}