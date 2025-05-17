import { Component, OnInit, PLATFORM_ID, Inject, Renderer2 } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { AdminSidebarComponent } from '../shared/components/sidebar/admin-sidebar.component';
import { UserSidebarComponent } from '../shared/components/sidebar/user-sidebar.component';
import jwt_decode from 'jwt-decode';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    AdminSidebarComponent,
    UserSidebarComponent
  ],
  template: `
    <div class="flex h-screen bg-gray-50 dark:bg-gray-900">
      <!-- Afficher la sidebar en fonction du rôle -->
      <app-admin-sidebar *ngIf="userRole === 'ROLE_ADMIN_ROLE'" [darkMode]="darkMode" [currentUrl]="currentUrl"></app-admin-sidebar>
      <app-user-sidebar *ngIf="userRole === 'ROLE_USER_ROLE'" [darkMode]="darkMode" [currentUrl]="currentUrl"></app-user-sidebar>

      <!-- Contenu principal -->
      <div class="flex flex-col flex-1 w-full">
        <!-- Navbar -->
        <header class="z-10 py-4 bg-white shadow-md dark:bg-gray-800">
          <div class="container flex items-center justify-between h-full px-6 mx-auto text-purple-600 dark:text-purple-300">
            <!-- Titre de la page -->
            <h2 class="text-2xl font-semibold text-gray-700 dark:text-gray-200">
              {{ getPageTitle() }}
            </h2>

            <!-- Actions -->
            <ul class="flex items-center flex-shrink-0 space-x-6">
              <!-- Theme toggle -->
              <li class="flex">
                <button class="rounded-md focus:outline-none focus:shadow-outline-purple" aria-label="Toggle theme" (click)="toggleDarkMode()">
                  <svg *ngIf="!darkMode" class="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
                  </svg>
                  <svg *ngIf="darkMode" class="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"></path>
                  </svg>
                </button>
              </li>
              <!-- Notifications -->
              <li class="relative">
                <button class="relative align-middle rounded-md focus:outline-none focus:shadow-outline-purple">
                  <svg class="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"></path>
                  </svg>
                  <!-- Notification badge -->
                  <span class="absolute top-0 right-0 inline-block w-3 h-3 transform translate-x-1 -translate-y-1 bg-red-600 border-2 border-white rounded-full dark:border-gray-800"></span>
                </button>
              </li>
              <!-- Profile & Logout -->
              <li class="relative">
                <button class="align-middle rounded-full focus:shadow-outline-purple focus:outline-none" (click)="logout()">
                  <svg class="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm1 2v10h10V5H4zm7 4a1 1 0 10-2 0v4a1 1 0 102 0V9z" clip-rule="evenodd"></path>
                  </svg>
                </button>
              </li>
            </ul>
          </div>
        </header>

        <!-- Content Area -->
        <main class="h-full overflow-y-auto">
          <div class="container px-6 mx-auto grid">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: []
})
export class AppLayoutComponent implements OnInit {
  darkMode = false;
  userRole: string = '';
  currentUrl: string = '';

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit() {
    this.checkLoginStatus();
    this.setupRouteListener();
    this.initThemeMode();
  }

  initThemeMode() {
    if (isPlatformBrowser(this.platformId)) {
      // Récupérer la préférence de thème
      const savedTheme = localStorage.getItem('darkMode');
      
      // Si une préférence existe, l'utiliser
      if (savedTheme !== null) {
        this.darkMode = savedTheme === 'true';
      } else {
        // Si aucune préférence, utiliser les préférences système
        const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.darkMode = prefersDarkMode;
        localStorage.setItem('darkMode', this.darkMode.toString());
      }

      // Appliquer le mode sur le document HTML
      this.applyThemeToDOM();
    }
  }

  applyThemeToDOM() {
    if (isPlatformBrowser(this.platformId)) {
      if (this.darkMode) {
        this.renderer.addClass(this.document.documentElement, 'dark');
        this.renderer.addClass(this.document.body, 'dark-mode');
      } else {
        this.renderer.removeClass(this.document.documentElement, 'dark');
        this.renderer.removeClass(this.document.body, 'dark-mode');
      }
    }
  }

  setupRouteListener() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentUrl = event.urlAfterRedirects;
    });
  }

  checkLoginStatus() {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const decoded: any = jwt_decode(token);
          this.userRole = decoded.role;
        } catch (error) {
          console.error('Error decoding token:', error);
          this.router.navigate(['/login']);
        }
      } else {
        this.router.navigate(['/login']);
      }
    }
  }

  toggleDarkMode() {
    this.darkMode = !this.darkMode;
    
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('darkMode', this.darkMode.toString());
      this.applyThemeToDOM();
    }
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      this.router.navigate(['/login']);
    }
  }

  getPageTitle(): string {
    const path = this.currentUrl.split('/')[1];
    if (path === 'admin') {
      return 'Admin Dashboard - Annotify';
    } else if (path === 'user') {
      return 'Annotateur Dashboard - Annotify';
    }
    return 'Annotify';
  }
} 