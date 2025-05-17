import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminDatasetsService, DashboardStats, DatasetAnnotationStatus } from '../admin-datasets.service';
import { AdminAnnotatorsService, Annotator } from '../admin-annotators.service';
import Chart from 'chart.js/auto';

interface Annotateur {
  id: number;
  nom: string;
  email: string;
  photo: string;
  annotations: number;
  precision: string;
  tempsMoyen: string;
  performance: string;
  couleurPerformance: string;
}

interface AccesRapide {
  id: number;
  titre: string;
  icone: string;
  route: string;
  couleur: string;
  description: string;
}

interface ActivityItem {
  id: number;
  text: string;
  time: string;
  iconColor: string;
  iconName: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('completionRateChart') completionRateChart!: ElementRef;
  
  // Référence à Math pour utilisation dans le template
  Math = Math;
  
  // Propriétés pour les statistiques
  stats: DashboardStats | null = null;
  isLoading = true;
  error = '';
  
  // Pour stocker les données d'annotation des datasets
  datasetAnnotations: DatasetAnnotationStatus[] = [];
  isDatasetsLoading: boolean = true; // État de chargement spécifique aux datasets
  
  // Charts
  progressChart: Chart | null = null;
  
  // Date actuelle formatée pour l'affichage
  currentDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Liste d'activités générée dynamiquement
  recentActivities: ActivityItem[] = [];
  
  // Photos de profil par défaut pour les annotateurs
  defaultPhotos = [
    'https://randomuser.me/api/portraits/women/42.jpg',
    'https://randomuser.me/api/portraits/men/32.jpg',
    'https://randomuser.me/api/portraits/women/67.jpg',
    'https://randomuser.me/api/portraits/men/51.jpg',
    'https://randomuser.me/api/portraits/women/33.jpg'
  ];
  
  // Liste des meilleurs annotateurs
  meilleursAnnotateurs: Annotateur[] = [];
  
  // Annotateurs bruts récupérés de l'API
  annotateursRaw: Annotator[] = [];

  accesRapides: AccesRapide[] = [
    {
      id: 1,
      titre: 'Ajouter un Annotateur',
      icone: 'user-plus',
      route: '/admin/annotateurs/nouveau',
      couleur: 'blue',
      description: 'Créer un nouveau compte annotateur'
    },
    {
      id: 2,
      titre: 'Importer un Dataset',
      icone: 'database-import',
      route: '/admin/datasets/import',
      couleur: 'green',
      description: 'Importer un nouveau jeu de données'
    },
    {
      id: 3,
      titre: 'Assigner des Tâches',
      icone: 'tasks',
      route: '/admin/taches/assignation',
      couleur: 'purple',
      description: 'Gérer l\'attribution des tâches'
    },
    {
      id: 4,
      titre: 'Générer un Rapport',
      icone: 'file-chart',
      route: '/admin/reports/nouveau',
      couleur: 'yellow',
      description: 'Créer un rapport de progrès'
    }
  ];

  constructor(
    private datasetsService: AdminDatasetsService,
    private annotatorsService: AdminAnnotatorsService
  ) {}

  ngOnInit() {
    this.loadStats();
    this.loadAnnotators();
    this.generateRecentActivities();
    this.loadDatasetsAnnotationStatus();
  }

  ngAfterViewInit() {
    // Initialiser les graphiques une fois que la vue est chargée
    setTimeout(() => {
      if (this.stats) {
        this.initCharts();
      }
    }, 500);
  }

  // Charger les statistiques générales
  loadStats() {
    this.isLoading = true;
    this.datasetsService.getDashboardStats().subscribe({
      next: (stats) => {
        console.log('Dashboard stats loaded:', stats);
        this.stats = stats;
        this.isLoading = false;
        
        // Initialiser les graphiques si la vue est prête
        if (this.completionRateChart) {
          this.initCharts();
        }
      },
      error: (error) => {
        console.error('Error loading dashboard stats:', error);
        this.error = 'Failed to load dashboard statistics. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  // Charger les annotations des datasets
  loadDatasetsAnnotationStatus() {
    this.isDatasetsLoading = true;
    
    // Au lieu d'utiliser des IDs hardcodés, récupérons d'abord la liste des datasets disponibles
    this.datasetsService.getDatasetsCouplesCount().subscribe({
      next: (data) => {
        console.log('Datasets available:', data);
        // Récupérer tous les IDs des datasets disponibles 
        const datasetIds = Object.keys(data.datasetsWithCouples).map(id => parseInt(id));
        
        // Limiter à maximum 3 datasets pour l'affichage
        const displayIds = datasetIds.slice(0, 3);
        
        console.log('Fetching annotation status for datasets:', displayIds);
        
        if (displayIds.length > 0) {
          // Charger les statuts d'annotation pour ces datasets
          this.datasetsService.getMultipleDatasetAnnotationStatuses(displayIds).subscribe({
            next: (annotations) => {
              console.log('Datasets annotation status loaded:', annotations);
              
              // Trier les datasets par pourcentage d'achèvement (décroissant)
              this.datasetAnnotations = annotations.sort((a, b) => {
                return parseFloat(b.completionPercentage) - parseFloat(a.completionPercentage);
              });
              
              this.isDatasetsLoading = false;
            },
            error: (error) => {
              console.error('Error loading datasets annotation status:', error);
              this.isDatasetsLoading = false;
            }
          });
        } else {
          // Aucun dataset disponible
          this.datasetAnnotations = [];
          this.isDatasetsLoading = false;
        }
      },
      error: (error) => {
        console.error('Error loading available datasets:', error);
        this.isDatasetsLoading = false;
      }
    });
  }

  // Charger les annotateurs
  loadAnnotators() {
    this.annotatorsService.getAnnotators().subscribe({
      next: (data) => {
        // Récupérer tous les annotateurs actifs
        this.annotateursRaw = Array.isArray(data) 
          ? data.filter((a: Annotator) => !a.deleted) 
          : (data?.annotateurs || []).filter((a: Annotator) => !a.deleted);
        
        // Mettre à jour la liste des meilleurs annotateurs
        this.updateMeilleursAnnotateurs();
      },
      error: (error) => {
        console.error('Error loading annotators:', error);
      }
    });
  }

  updateMeilleursAnnotateurs() {
    if (!this.annotateursRaw.length) return;

    // Trier les annotateurs par nombre d'annotations (décroissant)
    const sortedAnnotateurs = [...this.annotateursRaw].sort((a, b) => {
      const aCount = a.annotations?.length || 0;
      const bCount = b.annotations?.length || 0;
      return bCount - aCount;
    });

    // Prendre les 3 premiers
    const top3 = sortedAnnotateurs.slice(0, 3);

    // Convertir au format Annotateur pour l'affichage
    this.meilleursAnnotateurs = top3.map((a, index) => {
      const annotationCount = a.annotations?.length || 0;
      
      // Calculer la précision (valeur fictive basée sur le nombre d'annotations)
      const precision = 90 + Math.min(9, annotationCount / 10);
      
      // Déterminer la performance et la couleur
      let performance = 'Bonne';
      let couleur = 'blue';
      
      if (precision >= 95) {
        performance = 'Excellente';
        couleur = 'green';
      } else if (precision >= 92) {
        performance = 'Très Bonne';
        couleur = 'blue';
      } else if (precision < 85) {
        performance = 'À améliorer';
        couleur = 'yellow';
      }
      
      // Calculer un temps moyen fictif (entre 1m et 3m)
      const tempsBase = 60 + (index * 30);
      const tempsMoyen = `${Math.floor(tempsBase / 60)}m ${tempsBase % 60}s`;
      
      // Générer un email à partir du login si non fourni
      const email = `${a.login}@domain.com`;
      
      return {
        id: a.id || index + 1,
        nom: `${a.prenom} ${a.nom}`,
        email: email,
        photo: this.defaultPhotos[index % this.defaultPhotos.length],
        annotations: annotationCount,
        precision: `${precision.toFixed(1)}%`,
        tempsMoyen: tempsMoyen,
        performance: performance,
        couleurPerformance: couleur
      };
    });
  }

  initCharts() {
    if (!this.stats) return;
    
    this.initCompletionRateChart();
  }

  initCompletionRateChart() {
    if (!this.completionRateChart || !this.stats) return;

    const ctx = this.completionRateChart.nativeElement.getContext('2d');
    
    if (this.progressChart) {
      this.progressChart.destroy();
    }
    
    this.progressChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Complétés', 'En cours', 'Non assignés'],
        datasets: [{
          data: [
            this.stats.completedDatasets,
            this.stats.inProgressDatasets,
            this.stats.unassignedDatasets
          ],
          backgroundColor: [
            'rgba(75, 192, 192, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)'
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
          },
          title: {
            display: true,
            text: 'État des Datasets'
          }
        }
      }
    });
  }

  generateRecentActivities() {
    // Générer quelques activités fictives basées sur la date actuelle
    const now = new Date();
    
    this.recentActivities = [
      {
        id: 1,
        text: 'Nouveaux annotateurs ajoutés à la plateforme',
        time: this.getRandomPastTime(now, 1),
        iconColor: 'purple',
        iconName: 'user-plus'
      },
      {
        id: 2,
        text: 'Dataset "Hicham" complété à 100%',
        time: this.getRandomPastTime(now, 3),
        iconColor: 'green',
        iconName: 'check-circle'
      },
      {
        id: 3,
        text: 'Nouveau jeu de données "Mohammed" importé',
        time: this.getRandomPastTime(now, 6),
        iconColor: 'blue',
        iconName: 'database'
      },
      {
        id: 4,
        text: 'Tâches assignées aux annotateurs',
        time: this.getRandomPastTime(now, 12),
        iconColor: 'yellow',
        iconName: 'tasks'
      }
    ];
  }
  
  getRandomPastTime(now: Date, maxHoursAgo: number): string {
    const hoursAgo = Math.max(0.1, Math.random() * maxHoursAgo);
    const minutesAgo = Math.floor(hoursAgo * 60);
    
    if (minutesAgo < 60) {
      return `Il y a ${minutesAgo} minutes`;
    } else {
      const hours = Math.floor(minutesAgo / 60);
      return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    }
  }
  
  // Méthode pour obtenir un gradient de couleur en fonction du pourcentage
  getProgressGradient(progress: number): string {
    if (progress >= 75) {
      return 'linear-gradient(to right, #059669, #10B981)'; // Vert
    } else if (progress >= 50) {
      return 'linear-gradient(to right, #3B82F6, #60A5FA)'; // Bleu
    } else if (progress >= 25) {
      return 'linear-gradient(to right, #F59E0B, #FBBF24)'; // Orange
    } else {
      return 'linear-gradient(to right, #DC2626, #EF4444)'; // Rouge
    }
  }
  
  // Méthodes pour le donut chart
  
  getCompletedRatio(): number {
    if (!this.stats || !this.stats.totalDatasets) return 0;
    const completed = this.stats.completedDatasets || 0;
    return completed / this.stats.totalDatasets;
  }
  
  getCompletedCoords(): string {
    const ratio = this.getCompletedRatio();
    const angle = ratio * Math.PI * 2;
    const x = 50 + 50 * Math.sin(angle);
    const y = 50 - 50 * Math.cos(angle);
    return `${x}% ${y}%`;
  }
  
  getInProgressRatio(): number {
    if (!this.stats || !this.stats.totalDatasets) return 0;
    const inProgress = this.stats.inProgressDatasets || 0;
    return inProgress / this.stats.totalDatasets;
  }
  
  getInProgressStartCoords(): string {
    const completedRatio = this.getCompletedRatio();
    const angle = completedRatio * Math.PI * 2;
    const x = 50 + 50 * Math.sin(angle);
    const y = 50 - 50 * Math.cos(angle);
    return `${x}% ${y}%`;
  }
  
  getInProgressEndCoords(): string {
    const completedRatio = this.getCompletedRatio();
    const inProgressRatio = this.getInProgressRatio();
    const angle = (completedRatio + inProgressRatio) * Math.PI * 2;
    const x = 50 + 50 * Math.sin(angle);
    const y = 50 - 50 * Math.cos(angle);
    return `${x}% ${y}%`;
  }
  
  getUnassignedRatio(): number {
    if (!this.stats || !this.stats.totalDatasets) return 0;
    const unassigned = this.stats.unassignedDatasets || 0;
    return unassigned / this.stats.totalDatasets;
  }
  
  getUnassignedStartCoords(): string {
    const completedRatio = this.getCompletedRatio();
    const inProgressRatio = this.getInProgressRatio();
    const angle = (completedRatio + inProgressRatio) * Math.PI * 2;
    const x = 50 + 50 * Math.sin(angle);
    const y = 50 - 50 * Math.cos(angle);
    return `${x}% ${y}%`;
  }
  
  getUnassignedEndCoords(): string {
    const angle = Math.PI * 2;
    const x = 50 + 50 * Math.sin(angle);
    const y = 50 - 50 * Math.cos(angle);
    return `${x}% ${y}%`;
  }

  // Méthodes pour le graphique octogonal proportionnel
  
  // Calculer l'angle pour le segment des datasets en cours
  getInProgressAngle(): number {
    if (!this.stats || !this.stats.totalDatasets || this.stats.totalDatasets === 0) return 0;
    const inProgressRatio = this.stats.inProgressDatasets / this.stats.totalDatasets;
    return 360 * inProgressRatio;  // angle en degrés
  }
  
  // Calculer l'angle pour le segment des datasets non assignés
  getUnassignedAngle(): number {
    if (!this.stats || !this.stats.totalDatasets || this.stats.totalDatasets === 0) return 0;
    const unassignedRatio = this.stats.unassignedDatasets / this.stats.totalDatasets;
    return 360 * unassignedRatio;  // angle en degrés
  }
  
  // Calculer l'angle pour le segment des datasets complétés
  getCompletedAngle(): number {
    if (!this.stats || !this.stats.totalDatasets || this.stats.totalDatasets === 0) return 0;
    const completedRatio = this.stats.completedDatasets / this.stats.totalDatasets;
    return 360 * completedRatio;  // angle en degrés
  }
  
  // Générer un style clip-path pour le segment En cours
  getInProgressClipPath(): string {
    const inProgressAngle = this.getInProgressAngle();
    const unassignedAngle = this.getUnassignedAngle();
    const completedAngle = this.getCompletedAngle();
    
    // Si le segment est vide, ne pas l'afficher
    if (inProgressAngle <= 0) return 'polygon(0 0, 0 0, 0 0)';
    
    // Calculer les points du polygone pour le segment
    const startAngle = unassignedAngle;
    const endAngle = startAngle + inProgressAngle;
    
    // Générer le clip-path pour un segment correspondant exactement au pourcentage
    return this.generateSegmentClipPath(startAngle, endAngle);
  }
  
  // Générer un style clip-path pour le segment Non assignés
  getUnassignedClipPath(): string {
    const unassignedAngle = this.getUnassignedAngle();
    
    // Si le segment est vide, ne pas l'afficher
    if (unassignedAngle <= 0) return 'polygon(0 0, 0 0, 0 0)';
    
    // Calculer les points du polygone pour le segment
    const startAngle = 0;
    const endAngle = unassignedAngle;
    
    // Générer le clip-path pour un segment correspondant exactement au pourcentage
    return this.generateSegmentClipPath(startAngle, endAngle);
  }
  
  // Générer un style clip-path pour le segment Complétés
  getCompletedClipPath(): string {
    const inProgressAngle = this.getInProgressAngle();
    const unassignedAngle = this.getUnassignedAngle();
    const completedAngle = this.getCompletedAngle();
    
    // Si le segment est vide, ne pas l'afficher
    if (completedAngle <= 0) return 'polygon(0 0, 0 0, 0 0)';
    
    // Calculer les points du polygone pour le segment
    const startAngle = unassignedAngle + inProgressAngle;
    const endAngle = startAngle + completedAngle;
    
    // Générer le clip-path pour un segment correspondant exactement au pourcentage
    return this.generateSegmentClipPath(startAngle, endAngle);
  }
  
  // Méthode utilitaire pour générer un clip-path basé sur les angles
  private generateSegmentClipPath(startAngle: number, endAngle: number): string {
    // Convertir les angles en radians
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;
    
    // Calculer les coordonnées des points sur le cercle
    const startX = 50 + 50 * Math.cos(startRad);
    const startY = 50 + 50 * Math.sin(startRad);
    const endX = 50 + 50 * Math.cos(endRad);
    const endY = 50 + 50 * Math.sin(endRad);
    
    // Générer le clip-path (polygone avec le centre du cercle et les deux points)
    return `polygon(50% 50%, ${startX}% ${startY}%, ${endX}% ${endY}%)`;
  }

  // Méthodes pour le pie chart SVG
  
  // Crée un segment de camembert entre deux angles
  createPieSegment(startAngle: number, endAngle: number): string {
    // Limiter les angles pour éviter les erreurs
    startAngle = Math.min(360, Math.max(0, startAngle));
    endAngle = Math.min(360, Math.max(0, endAngle));
    
    // Si les angles sont identiques, renvoyer un chemin vide
    if (startAngle === endAngle) return '';
    
    // Calculer les coordonnées
    const radius = 40; // Rayon du camembert
    const centerX = 50; // Centre X
    const centerY = 50; // Centre Y
    
    // Convertir les angles en radians
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;
    
    // Calculer les points sur le cercle
    const startX = centerX + radius * Math.cos(startRad);
    const startY = centerY + radius * Math.sin(startRad);
    const endX = centerX + radius * Math.cos(endRad);
    const endY = centerY + radius * Math.sin(endRad);
    
    // Déterminer si l'arc est grand (> 180 degrés)
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    
    // Créer le chemin SVG pour le segment
    return `M ${centerX} ${centerY} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
  }
  
  // Calcule la position du libellé pour un angle donné
  createLabelPosition(angle: number): string {
    const radius = 25; // Distance depuis le centre (plus petit que le rayon du camembert)
    const centerX = 50; // Centre X
    const centerY = 50; // Centre Y
    
    // Convertir l'angle en radians
    const rad = (angle - 90) * Math.PI / 180;
    
    // Calculer la position du libellé
    const x = centerX + radius * Math.cos(rad);
    const y = centerY + radius * Math.sin(rad);
    
    return `translate(${x}, ${y})`;
  }
}
