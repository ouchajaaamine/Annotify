import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ViewEncapsulation } from '@angular/core';

interface Annotation {
  id: number;
  annotateur: number;
  coupleText: {
    id: number;
    text_1: string;
    text_2: string;
    originalId: number | null;
  } | null;
  chosenClass: string;
}

interface Annotator {
  id: number;
  nom: string;
  prenom: string;
  login: string;
  annotations: Annotation[];
}

@Component({
  selector: 'app-task-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-details.component.html',
  styleUrl: './task-details.component.css',
  encapsulation: ViewEncapsulation.None
})
export class TaskDetailsComponent implements OnInit {
  taskId: string | null = null;
  currentCouple: any = null;
  currentIndex: number = 0;
  selectedClass: string = '';
  classes: { id: number, textClass: string }[] = [];
  notification: string = '';
  totalCouples: number = 0;
  loading = true;
  error = '';
  userName: string = '';
  annotations: Annotation[] = [];

  constructor(
    private http: HttpClient, 
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Appliquer le dark mode si nécessaire
    this.checkDarkMode();
    
    this.taskId = this.route.snapshot.paramMap.get('id');
    if (this.taskId) {
      this.loadTaskDetails();
      this.fetchTaskClasses();
      this.loadAnnotations();
    }
  }

  // Méthode pour vérifier et appliquer le dark mode sur l'élément du composant
  checkDarkMode() {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    const htmlElement = document.documentElement;
    
    if (darkMode) {
      htmlElement.classList.add('dark');
      // Appliquer le mode sombre directement aux éléments du composant
      document.querySelectorAll('.task-details-component').forEach(el => {
        el.classList.add('dark-mode');
      });
    } else {
      htmlElement.classList.remove('dark');
      document.querySelectorAll('.task-details-component').forEach(el => {
        el.classList.remove('dark-mode');
      });
    }
  }

  loadAnnotations() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<Annotator[]>(`http://localhost:8080/api/admin/tasks/datasets/${this.taskId}/annotators`, { headers })
      .subscribe({
        next: (annotators) => {
          // Trouver l'annotateur actuel (premier annotateur pour l'exemple)
          const currentAnnotator = annotators[0];
          if (currentAnnotator) {
            this.annotations = currentAnnotator.annotations;
            this.updateCurrentCoupleStatus();
          }
        },
        error: (err) => {
          console.error('Error loading annotations:', err);
        }
      });
  }

  updateCurrentCoupleStatus() {
    if (this.currentCouple) {
      const annotation = this.annotations.find(a => 
        a.coupleText && a.coupleText.id === this.currentCouple.id
      );
      
      if (annotation) {
        this.currentCouple.status = 'Annoté';
        this.currentCouple.annotationClass = annotation.chosenClass;
        this.selectedClass = annotation.chosenClass;
      } else {
        this.currentCouple.status = 'Non annoté';
        this.currentCouple.annotationClass = null;
        this.selectedClass = '';
      }
    }
  }

  loadTaskDetails() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any>(`http://localhost:8080/api/user/tasks/${this.taskId}?index=${this.currentIndex}`, { headers }).subscribe({
      next: (taskData) => {
        console.log('Task data:', taskData);
        this.currentCouple = taskData.currentCouple;
        this.totalCouples = taskData.totalCouples;
        this.userName = taskData.userName;
        this.updateCurrentCoupleStatus();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading task:', err);
        this.error = 'Failed to load task details.';
        this.loading = false;
      }
    });
  }

  fetchTaskClasses() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any>(`http://localhost:8080/api/user/tasks/${this.taskId}/classes`, { headers }).subscribe({
      next: (data) => {
        console.log('Classes data:', data);
        this.classes = data.classes || [];
      },
      error: (err) => {
        console.error('Error loading classes:', err);
        this.classes = [];
      }
    });
  }

  annotateCurrentCouple() {
    if (!this.selectedClass || !this.currentCouple) return;
    
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    const payload = {
      coupleId: this.currentCouple.id,
      classSelection: this.selectedClass,
      notes: '',
      currentIndex: this.currentIndex
    };

    this.http.post(
      `http://localhost:8080/api/user/tasks/${this.taskId}/annotate`,
      payload,
      { headers }
    ).subscribe({
      next: (response: any) => {
        this.notification = 'Annotation enregistrée avec succès!';
        if (response.completed) {
          this.notification = response.completionMessage;
          setTimeout(() => {
            this.router.navigate(['/user/tasks']);
          }, 2000);
        } else {
          this.currentIndex = response.nextIndex;
          this.loadTaskDetails();
          this.loadAnnotations(); // Recharger les annotations après une nouvelle annotation
        }
      },
      error: (err) => {
        console.error('Erreur annotation:', err);
        this.notification = "Erreur lors de l'enregistrement de l'annotation.";
      }
    });
  }

  goToNextCouple() {
    if (this.currentIndex < this.totalCouples - 1) {
      this.currentIndex++;
      this.loadTaskDetails();
      this.selectedClass = '';
      this.notification = '';
    }
  }

  goToPreviousCouple() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.loadTaskDetails();
      this.selectedClass = '';
      this.notification = '';
    }
  }
}
