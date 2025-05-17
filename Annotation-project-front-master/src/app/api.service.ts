// src/app/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';

interface LoginCredentials {
  login: string;
  password: string;
}

interface LoginResponse {
  token: string;
  role: string;
}

@Injectable({
  providedIn: 'root' // Disponible dans toute l'application
})
export class ApiService {
  private apiUrl = 'http://localhost:8080/api'; // URL de base de l'API backend

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }


  private handleError(error: HttpErrorResponse) {
    console.log('Full error response:', error);
    console.log('Error status:', error.status);
    console.log('Error message:', error.message);
    console.log('Error error:', error.error);

    let errorMessage = 'Une erreur est survenue';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      if (error.status === 401) {
        errorMessage = 'Nom d\'utilisateur ou mot de passe incorrect';
      } else if (error.status === 0) {
        errorMessage = 'Impossible de se connecter au serveur. Veuillez vérifier que le serveur est en cours d\'exécution.';
      } else {
        errorMessage = `Erreur serveur (${error.status}): ${error.message}`;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }

  // Appelle l'endpoint /api/auth/login pour connecter l'utilisateur
  login(credentials: LoginCredentials): Observable<LoginResponse> {
    const headers = this.getHeaders();
    const body = {
      login: credentials.login.trim(),
      password: credentials.password
    };

    console.log('Sending login request with body:', body);

    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, body, { 
      headers,
      observe: 'response'
    }).pipe(
      tap(response => {
        console.log('Login response:', response);
      }),
      map(response => response.body as LoginResponse),
      catchError(this.handleError)
    );
  }
}