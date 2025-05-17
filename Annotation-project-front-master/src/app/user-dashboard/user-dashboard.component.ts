import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import Chart from 'chart.js/auto';
import { HttpClient } from '@angular/common/http';

interface Task {
  id: string;
  datasetName: string;
  type: string;
  deadline: string;
  status: 'pending' | 'in-progress' | 'urgent' | 'completed';
  progress: number;
}

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-dashboard.component.html',
  styleUrl: './user-dashboard.component.css'
})
export class UserDashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('activityChart') activityChartRef!: ElementRef;
  @ViewChild('accuracyChart') accuracyChartRef!: ElementRef;
  @ViewChild('progressChart') progressChartRef!: ElementRef;
  @ViewChild('annotationTypesChart') annotationTypesChartRef!: ElementRef;

  tasks: any[] = [];
  userName: string = '';
  taskProgressMap: { [key: string]: number } = {};

  // Historique des annotations (3 derniers)
  historyAnnotations: any[] = [];
  get lastThreeAnnotations() {
    // Fusionner les objets du tableau principal et ceux de annotateur.annotations
    let mainObjs = (this._rawHistoryAnnotations || []).filter((a: any) => typeof a === 'object');
    let annotateurObjs: any[] = [];
    if (mainObjs.length > 0 && mainObjs[0].annotateur && Array.isArray(mainObjs[0].annotateur.annotations)) {
      annotateurObjs = mainObjs[0].annotateur.annotations.filter((a: any) => typeof a === 'object');
    }
    const allObjs = [...mainObjs, ...annotateurObjs];
    const uniqueObjs = allObjs.filter((obj, index, self) =>
      obj && obj.id && self.findIndex(o => o.id === obj.id) === index
    );
    // Trier par id décroissant (plus récent en premier)
    uniqueObjs.sort((a, b) => b.id - a.id);
    return uniqueObjs.slice(0, 3);
  }
  private _rawHistoryAnnotations: any[] = [];

  // Cards dynamiques
  get totalTasks() {
    return this.tasks.length;
  }
  get completedTasks() {
    return this.tasks.filter(t => (this.taskProgressMap[t.id] || 0) >= 100).length;
  }
  get inProgressTasks() {
    return this.tasks.filter(t => (this.taskProgressMap[t.id] || 0) > 0 && (this.taskProgressMap[t.id] || 0) < 100).length;
  }

  // Statistiques utilisateur
  stats = {
    pendingTasks: 12,
    completedTasks: 34,
    urgentTasks: 3,
    accuracyRate: 94.2,
    totalAnnotations: 426,
    weeklyGoal: 500,
    progressPercentage: 85.2
  };

  // Données pour les graphiques
  activityData = [22, 35, 28, 41, 36, 42, 38];
  accuracyData = [92, 93, 91, 95, 94, 93, 94.2];
  weeklyProgress = 72;
  
  // Types d'annotation
  annotationTypes = {
    classification: 42,
    extraction: 28,
    segmentation: 15,
    tagging: 15
  };

  // Tâches récentes
  recentTasks: Task[] = [
    {
      id: '#1234',
      datasetName: 'Images médicales',
      type: 'Classification',
      deadline: '23 Mai 2025',
      status: 'pending',
      progress: 0
    },
    {
      id: '#1235',
      datasetName: 'Documents juridiques',
      type: 'Extraction d\'entités',
      deadline: '25 Mai 2025',
      status: 'in-progress',
      progress: 45
    },
    {
      id: '#1236',
      datasetName: 'Images satellites',
      type: 'Segmentation',
      deadline: '27 Mai 2025',
      status: 'urgent',
      progress: 10
    },
    {
      id: '#1237',
      datasetName: 'Articles scientifiques',
      type: 'Tagging',
      deadline: '29 Mai 2025',
      status: 'completed',
      progress: 100
    }
  ];

  // Performance metrics
  performanceMetrics = {
    speed: {
      value: 85,
      rating: 'Au-dessus de la moyenne'
    },
    accuracy: {
      value: 92,
      rating: 'Excellent'
    },
    consistency: {
      value: 78,
      rating: 'Bon'
    },
    attention: {
      value: 88,
      rating: 'Très bon'
    }
  };

  // Données pour le heatmap
  activityHeatmap: number[][] = [
    [0, 2, 5, 3, 1, 0, 0],
    [1, 3, 6, 4, 2, 1, 0],
    [2, 4, 7, 5, 3, 2, 1],
    [1, 3, 5, 4, 2, 1, 0]
  ];

  // Jours de la semaine
  weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
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

    // Charger l'historique des annotations
    this.http.get<any>('http://localhost:8080/api/user/history').subscribe({
      next: (data) => {
        this.userName = data.userName || '';
        this._rawHistoryAnnotations = data.annotations || [];
      },
      error: () => {
        this._rawHistoryAnnotations = [];
        this.userName = '';
      }
    });
  }

  ngAfterViewInit() {
    this.initActivityChart();
    this.initAccuracyChart();
    this.initProgressChart();
    this.initAnnotationTypesChart();
  }

  initActivityChart() {
    if (this.activityChartRef) {
      const ctx = this.activityChartRef.nativeElement.getContext('2d');
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
          datasets: [{
            label: 'Annotations',
            data: this.activityData,
            fill: true,
            backgroundColor: 'rgba(99, 102, 241, 0.2)',
            borderColor: 'rgba(99, 102, 241, 1)',
            tension: 0.4,
            pointBackgroundColor: 'rgba(99, 102, 241, 1)',
            pointBorderColor: '#fff',
            pointRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                display: true,
                color: 'rgba(0, 0, 0, 0.05)'
              }
            },
            x: {
              grid: {
                display: false
              }
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              padding: 10,
              titleFont: {
                size: 14
              },
              bodyFont: {
                size: 13
              }
            }
          }
        }
      });
    }
  }

  initAccuracyChart() {
    if (this.accuracyChartRef) {
      const ctx = this.accuracyChartRef.nativeElement.getContext('2d');
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
          datasets: [{
            label: 'Précision (%)',
            data: this.accuracyData,
            fill: false,
            borderColor: 'rgba(16, 185, 129, 1)',
            tension: 0.3,
            pointBackgroundColor: 'rgba(16, 185, 129, 1)',
            pointBorderColor: '#fff',
            pointRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              min: 85,
              max: 100,
              grid: {
                display: true,
                color: 'rgba(0, 0, 0, 0.05)'
              }
            },
            x: {
              grid: {
                display: false
              }
            }
          },
          plugins: {
            legend: {
              display: false
            }
          }
        }
      });
    }
  }

  initProgressChart() {
    if (this.progressChartRef) {
      const ctx = this.progressChartRef.nativeElement.getContext('2d');
      new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Complété', 'Restant'],
          datasets: [{
            data: [this.stats.totalAnnotations, this.stats.weeklyGoal - this.stats.totalAnnotations],
            backgroundColor: [
              'rgba(99, 102, 241, 1)',
              'rgba(226, 232, 240, 1)'
            ],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '80%',
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              enabled: true,
              callbacks: {
                label: function(context) {
                  return context.label + ': ' + context.parsed;
                }
              }
            }
          }
        }
      });
    }
  }

  initAnnotationTypesChart() {
    if (this.annotationTypesChartRef) {
      const ctx = this.annotationTypesChartRef.nativeElement.getContext('2d');
      new Chart(ctx, {
        type: 'pie',
        data: {
          labels: ['Classification', 'Extraction', 'Segmentation', 'Tagging'],
          datasets: [{
            data: [
              this.annotationTypes.classification,
              this.annotationTypes.extraction,
              this.annotationTypes.segmentation,
              this.annotationTypes.tagging
            ],
            backgroundColor: [
              'rgba(59, 130, 246, 0.8)',
              'rgba(16, 185, 129, 0.8)',
              'rgba(245, 158, 11, 0.8)',
              'rgba(99, 102, 241, 0.8)'
            ],
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 15,
                usePointStyle: true,
                pointStyle: 'circle'
              }
            }
          }
        }
      });
    }
  }

  // Méthode pour obtenir la classe CSS appropriée pour le statut
  getStatusClass(status: string): string {
    switch(status) {
      case 'pending': return 'status-pending';
      case 'in-progress': return 'status-in-progress';
      case 'urgent': return 'status-urgent';
      case 'completed': return 'status-completed';
      default: return '';
    }
  }

  // Méthode pour obtenir le texte du bouton d'action
  getActionText(status: string): string {
    switch(status) {
      case 'pending': return 'Démarrer';
      case 'in-progress': return 'Continuer';
      case 'urgent': return 'Prioritaire';
      case 'completed': return 'Revoir';
      default: return 'Voir';
    }
  }
}
