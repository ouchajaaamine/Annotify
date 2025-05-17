import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.css',
  encapsulation: ViewEncapsulation.None
})
export class TasksComponent implements OnInit {
  tasks: any[] = [];
  userName: string = '';
  taskProgressMap: { [key: string]: number } = {};

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    // Appliquer le dark mode si nécessaire
    this.checkDarkMode();
    
    this.http.get<any>('http://localhost:8080/api/user/tasks').subscribe({
      next: (data) => {
        this.tasks = data.tasks || [];
        this.userName = data.userName || '';
        this.taskProgressMap = data.taskProgressMap || {};
      },
      error: (err) => {
        this.tasks = [];
        this.userName = '';
        this.taskProgressMap = {};
      }
    });
  }

  // Méthode pour vérifier et appliquer le dark mode sur l'élément du composant
  checkDarkMode() {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    const htmlElement = document.documentElement;
    
    if (darkMode) {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
  }

  goToAnnotate(taskId: number) {
    console.log("heey")
    this.http.get<any>(`http://localhost:8080/api/user/tasks/${taskId}`).subscribe({
      next: (data) => {
        this.router.navigate(['/user/annotate', taskId]);
      },
      error: (err) => {
        console.error('Erreur API:', err);
        alert('Erreur lors de la récupération des détails de la tâche');
      }
    });
  }
}
