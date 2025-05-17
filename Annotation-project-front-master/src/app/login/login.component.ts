import { Component, OnInit, ElementRef, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../api.service';
import jwt_decode from 'jwt-decode';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    HttpClientModule
  ],
  providers: [ApiService],
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  username: string = '';
  password: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;
  isFormVisible: boolean = false;

  constructor(
    private apiService: ApiService, 
    private router: Router,
    private renderer: Renderer2,
    private el: ElementRef
  ) {}

  ngOnInit() {
    // Animation d'apparition du formulaire après chargement de la page
    setTimeout(() => {
      this.isFormVisible = true;
    }, 300);
  }

  // Ajouter un effet d'onde au clic sur le bouton
  addRippleEffect(event: MouseEvent) {
    const button = event.currentTarget as HTMLElement;
    const circle = this.renderer.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    this.renderer.addClass(circle, 'ripple-effect');
    this.renderer.setStyle(circle, 'width', `${diameter}px`);
    this.renderer.setStyle(circle, 'height', `${diameter}px`);
    this.renderer.setStyle(circle, 'left', `${event.clientX - button.getBoundingClientRect().left - radius}px`);
    this.renderer.setStyle(circle, 'top', `${event.clientY - button.getBoundingClientRect().top - radius}px`);

    this.renderer.appendChild(button, circle);

    setTimeout(() => {
      this.renderer.removeChild(button, circle);
    }, 600);
  }

  onSubmit() {
    // Masquer les messages d'erreur précédents
    this.errorMessage = '';
    this.isLoading = true;

    // Simuler un délai minimum pour montrer l'animation de chargement
    setTimeout(() => {
      const credentials = { login: this.username, password: this.password };
      this.apiService.login(credentials).subscribe({
        next: (response) => {
          const token = response.token;
          localStorage.setItem('token', token);
          const role = this.getRoleFromToken(token);
          
          // Ajouter une animation de transition avant la redirection
          try {
            const formElement = this.el.nativeElement.querySelector('.bg-gradient-to-b');
            if (formElement) {
              this.renderer.setStyle(formElement, 'transform', 'scale(0.95)');
              this.renderer.setStyle(formElement, 'opacity', '0');
            }
          } catch (e) {
            console.error('Animation error:', e);
          }
          
          // Assurer la redirection même si l'animation échoue
          setTimeout(() => {
            this.isLoading = false;
            if (role === 'ROLE_ADMIN_ROLE') {
              this.router.navigate(['/admin/dashboard']);
            } else if (role === 'ROLE_USER_ROLE') {
              this.router.navigate(['/user/dashboard']);
            } else {
              this.errorMessage = 'Rôle non reconnu';
              this.resetFormAnimation();
            }
          }, 500);
        },
        error: (error) => {
          console.error('Login error:', error);
          if (error.status === 401) {
            this.errorMessage = 'Nom d\'utilisateur ou mot de passe incorrect';
          } else {
            this.errorMessage = 'Une erreur est survenue lors de la connexion';
          }
          this.isLoading = false;
          this.shakeForm();
        },
        complete: () => {
          if (!this.errorMessage) {
            this.isLoading = false;
          }
        }
      });
    }, 800);
  }

  // Animation de secousse pour le formulaire en cas d'erreur
  shakeForm() {
    try {
      const formElement = this.el.nativeElement.querySelector('.bg-gradient-to-b');
      if (formElement) {
        this.renderer.addClass(formElement, 'animate-shake');
        
        setTimeout(() => {
          this.renderer.removeClass(formElement, 'animate-shake');
        }, 500);
      }
    } catch (e) {
      console.error('Animation error:', e);
    }
  }

  // Réinitialiser l'animation du formulaire
  resetFormAnimation() {
    try {
      const formElement = this.el.nativeElement.querySelector('.bg-gradient-to-b');
      if (formElement) {
        this.renderer.removeStyle(formElement, 'transform');
        this.renderer.removeStyle(formElement, 'opacity');
      }
    } catch (e) {
      console.error('Animation error:', e);
    }
    this.isLoading = false;
  }

  getRoleFromToken(token: string): string {
    try {
      const decoded: any = jwt_decode(token);
      return decoded.role;
    } catch (error) {
      console.error('Error decoding token:', error);
      return "null";
    }
  }
}
