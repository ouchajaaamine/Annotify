import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  template: `
    <aside class="z-20 flex w-64 overflow-y-auto bg-white dark:bg-gray-800 md:block flex-shrink-0 shadow-lg h-screen">
      <div class="py-4 text-gray-500 dark:text-gray-400 flex flex-col h-full">
        <div class="ml-6 flex items-center">
          <div class="h-8 w-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-md flex items-center justify-center text-white shadow-lg relative overflow-hidden">
            <!-- Logo Annotify (bulle avec coche) -->
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4" />
            </svg>
            <div class="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent"></div>
          </div>
          <span class="ml-3 text-xl font-bold text-gray-800 dark:text-gray-200">Annotify</span>
        </div>
        <ul class="mt-6 flex-grow">
          <li class="relative px-6 py-3">
            <span 
              *ngIf="isActiveRoute('/admin/dashboard')" 
              class="absolute inset-y-0 left-0 w-1 bg-purple-600 rounded-tr-lg rounded-br-lg" 
              aria-hidden="true">
            </span>
            <a 
              class="inline-flex items-center w-full text-sm font-semibold transition-colors duration-150 hover:text-gray-800 dark:hover:text-gray-200" 
              [ngClass]="{'text-gray-800 dark:text-gray-100': isActiveRoute('/admin/dashboard')}"
              routerLink="/admin/dashboard">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
              </svg>
              <span class="ml-4">Dashboard</span>
            </a>
          </li>
          <li class="relative px-6 py-3">
            <span 
              *ngIf="isActiveRoute('/admin/annotateurs')" 
              class="absolute inset-y-0 left-0 w-1 bg-purple-600 rounded-tr-lg rounded-br-lg" 
              aria-hidden="true">
            </span>
            <a 
              class="inline-flex items-center w-full text-sm font-semibold transition-colors duration-150 hover:text-gray-800 dark:hover:text-gray-200" 
              [ngClass]="{'text-gray-800 dark:text-gray-100': isActiveRoute('/admin/annotateurs')}"
              routerLink="/admin/annotateurs">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
              <span class="ml-4">Annotateurs</span>
            </a>
          </li>
          <li class="relative px-6 py-3">
            <span 
              *ngIf="isActiveRoute('/admin/datasets')" 
              class="absolute inset-y-0 left-0 w-1 bg-purple-600 rounded-tr-lg rounded-br-lg" 
              aria-hidden="true">
            </span>
            <a 
              class="inline-flex items-center w-full text-sm font-semibold transition-colors duration-150 hover:text-gray-800 dark:hover:text-gray-200" 
              [ngClass]="{'text-gray-800 dark:text-gray-100': isActiveRoute('/admin/datasets')}"
              routerLink="/admin/datasets">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"></path>
              </svg>
              <span class="ml-4">Datasets</span>
            </a>
          </li>
        </ul>
        <div class="px-6 my-6">
          <!-- Bouton de déconnexion -->
          <button 
            (click)="logout()" 
            class="flex items-center justify-between w-full px-4 py-2 mt-4 text-sm font-medium leading-5 text-white transition-colors duration-150 bg-red-600 border border-transparent rounded-lg active:bg-red-600 hover:bg-red-700 focus:outline-none focus:shadow-outline-red"
          >
            Déconnexion
            <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
          </button>
        </div>
      </div>
    </aside>
  `,
  styles: []
})
export class AdminSidebarComponent {
  @Input() darkMode = false;
  @Input() currentUrl: string = '';

  constructor(private router: Router) {}

  isActiveRoute(route: string): boolean {
    return this.currentUrl.startsWith(route);
  }
  
  logout(): void {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
} 