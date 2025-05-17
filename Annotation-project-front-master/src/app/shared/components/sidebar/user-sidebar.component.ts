import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-user-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  template: `
    <aside class="sidebar bg-white dark:bg-gray-800 shadow-lg">
      <div class="sidebar-header py-4">
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
      </div>
      <nav class="mt-6">
        <ul>
          <li class="relative px-6 py-3">
            <span 
              *ngIf="isActiveRoute('/user/dashboard')" 
              class="absolute inset-y-0 left-0 w-1 bg-purple-600 rounded-tr-lg rounded-br-lg" 
              aria-hidden="true">
            </span>
            <a 
              class="inline-flex items-center w-full text-sm font-semibold transition-colors duration-150 hover:text-gray-800 dark:hover:text-gray-200" 
              [ngClass]="{'text-gray-800 dark:text-gray-100': isActiveRoute('/user/dashboard')}"
              routerLink="/user/dashboard">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
              </svg>
              <span class="ml-4">Dashboard</span>
            </a>
          </li>
          <li class="relative px-6 py-3">
            <span 
              *ngIf="isActiveRoute('/user/tasks')" 
              class="absolute inset-y-0 left-0 w-1 bg-purple-600 rounded-tr-lg rounded-br-lg" 
              aria-hidden="true">
            </span>
            <a 
              class="inline-flex items-center w-full text-sm font-semibold transition-colors duration-150 hover:text-gray-800 dark:hover:text-gray-200" 
              [ngClass]="{'text-gray-800 dark:text-gray-100': isActiveRoute('/user/tasks')}"
              routerLink="/user/tasks">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
              </svg>
              <span class="ml-4">Mes Tâches</span>
            </a>
          </li>
          <li class="relative px-6 py-3">
            <span 
              *ngIf="isActiveRoute('/user/history')" 
              class="absolute inset-y-0 left-0 w-1 bg-purple-600 rounded-tr-lg rounded-br-lg" 
              aria-hidden="true">
            </span>
            <a 
              class="inline-flex items-center w-full text-sm font-semibold transition-colors duration-150 hover:text-gray-800 dark:hover:text-gray-200" 
              [ngClass]="{'text-gray-800 dark:text-gray-100': isActiveRoute('/user/history')}"
              routerLink="/user/history">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span class="ml-4">Historique</span>
            </a>
          </li>
        </ul>
      </nav>
      <div class="sidebar-footer mt-auto px-4 py-4 border-t border-gray-200 dark:border-gray-700">
        <div class="flex items-center">
          <div class="flex-shrink-0 w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
            <svg class="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Annotateur</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Connecté</p>
          </div>
        </div>
        
        <!-- Bouton de déconnexion -->
        <button 
          (click)="logout()" 
          class="mt-4 w-full flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors duration-150 focus:outline-none focus:shadow-outline-red"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
          </svg>
          Déconnexion
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 250px;
      height: 100vh;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }
    
    .sidebar-header {
      flex-shrink: 0;
    }
    
    .sidebar-footer {
      margin-top: auto;
    }
  `]
})
export class UserSidebarComponent {
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