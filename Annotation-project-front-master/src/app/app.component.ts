import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule
  ]
})
export class AppComponent implements OnInit {
  title = 'annotation-platform';
  isLoggedIn = false;
  role: string = '';

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.checkLoginStatus();
  }

  checkLoginStatus() {
    // Vérifier si nous sommes dans un environnement navigateur
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      if (token) {
        this.isLoggedIn = true;
        // Vous pouvez également extraire le rôle ici si nécessaire
        // this.userRole = this.extractRoleFromToken(token);
      } else {
        this.isLoggedIn = false;
      }
    }
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      this.isLoggedIn = false;
      this.router.navigate(['/login']);
    }
  }
}
