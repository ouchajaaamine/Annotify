import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminDatasetsService, DatasetView, Task as ServiceTask, Annotateur as ServiceAnnotateur, DashboardStats } from '../admin-datasets.service';
import { RouterModule } from '@angular/router';
import { AdminAnnotatorsService, Annotator } from '../admin-annotators.service';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface Dataset {
  id: number;
  name: string;
  description: string;
  filePath: string;
  fileType: string;
  tasks: ServiceTask[];
  classesPossibles: Class[];
  coupleTexts: any;
}

interface Task {
  id: number;
  dateLimite: string;
  annotateur: Annotator;
  couples: any;
}

interface Annotateur {
  id: number;
  nom: string;
  prenom: string;
  login: string;
  deleted: boolean;
  role: Role;
}

interface Role {
  id: number;
  role: string;
}

interface Class {
  id: number;
  textClass: string;
}

interface DatasetAnnotationStatus {
  datasetId: number;
  completionPercentage: string;
  totalCouples: number;
  annotationsCount: number;
}

@Component({
  selector: 'app-datasets',
  templateUrl: './datasets.component.html',
  styleUrls: ['./datasets.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule]
})
export class DatasetsComponent implements OnInit {
  datasets: Dataset[] = [];
  filteredDatasetsAll: Dataset[] = [];
  filteredDatasets: Dataset[] = [];
  searchTerm = '';
  showFilterMenu = false;
  filters = { completed: false, inProgress: false, unassigned: false };
  currentPage = 1;
  pageSize = 5;
  showAddModal = false;
  newDataset = {
    name: '',
    description: '',
    classesRaw: '',
    file: null as File | null
  };
  isSubmitting = false;
  addError = '';
  showAssignModal = false;
  assignAnnotators: Annotator[] = [];
  assignSelectedAnnotators: number[] = [];
  assignDeadline: string = '';
  assignError = '';
  assignLoading = false;
  assignDatasetId: number|null = null;
  today = new Date().toISOString().split('T')[0];
  error = '';
  
  // New properties for the updated assign modal
  annotators: Annotator[] = [];
  selectedAnnotatorIds: number[] = [];
  assignmentDeadline: string = '';
  assignSubmitting: boolean = false;

  // Propriétés pour les statistiques
  stats: DashboardStats | null = null;

  // Map to store the dataset annotation statuses
  datasetAnnotationStatuses: Map<number, DatasetAnnotationStatus> = new Map();

  constructor(
    private datasetsService: AdminDatasetsService,
    private annotatorsService: AdminAnnotatorsService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadDatasets();
    this.loadStats();
  }

  loadStats() {
    this.datasetsService.getDashboardStats().subscribe({
      next: (stats) => {
        console.log('Dashboard stats loaded:', stats);
        this.stats = stats;
        
        // Calculate completion percentages if they don't exist
        if (this.stats.datasetsProgress && 
            this.stats.datasetsProgress.totalCouples && 
            this.stats.datasetsProgress.annotatedCouples) {
          
          if (!this.stats.datasetsProgress.completionPercentages) {
            this.stats.datasetsProgress.completionPercentages = [];
          }
          
          for (let i = 0; i < this.stats.datasetsProgress.totalCouples.length; i++) {
            const total = this.stats.datasetsProgress.totalCouples[i];
            const annotated = this.stats.datasetsProgress.annotatedCouples[i];
            
            if (total > 0) {
              const percentage = Math.round((annotated / total) * 100);
              this.stats.datasetsProgress.completionPercentages[i] = percentage;
            } else {
              this.stats.datasetsProgress.completionPercentages[i] = 0;
            }
          }
        }
      },
      error: (error) => {
        console.error('Error loading dashboard stats:', error);
        this.error = 'Failed to load dashboard statistics. Please try again later.';
      }
    });
  }

  loadDatasets() {
    this.datasetsService.getDatasets().subscribe({
      next: (datasets) => {
        console.log('Datasets loaded:', datasets);
        this.datasets = datasets.map(d => ({
          id: d.id,
          name: d.name,
          description: d.raw.description || '',
          filePath: '',
          fileType: d.raw.fileType || '',
          tasks: d.raw.tasks || [],
          classesPossibles: [],
          coupleTexts: []
        }));
        this.filteredDatasetsAll = [...this.datasets];
        
        // Load annotation status for each dataset
        this.loadAllDatasetsAnnotationStatus();
      },
      error: (error) => {
        console.error('Error loading datasets:', error);
        this.error = 'Failed to load datasets. Please try again later.';
      }
    });
  }

  // Load annotation status for all datasets
  loadAllDatasetsAnnotationStatus() {
    if (this.datasets.length === 0) return;
    
    const datasetIds = this.datasets.map(d => d.id);
    this.datasetsService.getMultipleDatasetAnnotationStatuses(datasetIds).subscribe({
      next: (statuses) => {
        console.log('Dataset annotation statuses loaded:', statuses);
        // Store in map for quick access
        statuses.forEach(status => {
          this.datasetAnnotationStatuses.set(status.datasetId, status);
        });
      },
      error: (error) => {
        console.error('Error loading dataset annotation statuses:', error);
      }
    });
  }

  // Stats - utiliser les stats de l'API
  get completedCount() { 
    return this.stats?.completedDatasets ?? 0;
  }
  
  get inProgressCount() { 
    return this.stats?.inProgressDatasets ?? 0;
  }
  
  get unassignedCount() { 
    return this.stats?.unassignedDatasets ?? 0;
  }

  // Recherche et filtres
  onSearch() { this.applyFilters(); }
  toggleFilterMenu() { this.showFilterMenu = !this.showFilterMenu; }
  onFilterChange() { this.applyFilters(); }
  applyFilters() {
    let result = [...this.datasets];
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.trim().toLowerCase();
      result = result.filter(d => d.name.toLowerCase().includes(search));
    }
    const { completed, inProgress, unassigned } = this.filters;
    if (completed || inProgress || unassigned) {
      result = result.filter(d => {
        const status = this.getStatus(d);
        return (completed && status === 'Completed') ||
               (inProgress && status === 'In Progress') ||
               (unassigned && status === 'Unassigned');
      });
    }
    this.filteredDatasetsAll = result;
    this.showFilterMenu = false;
  }
  
  clearFilters() {
    this.filters = { completed: false, inProgress: false, unassigned: false };
    this.searchTerm = '';
    this.applyFilters();
    this.showFilterMenu = true;
  }

  openAddModal() {
    this.showAddModal = true;
    this.newDataset = { name: '', description: '', classesRaw: '', file: null };
    this.addError = '';
  }
  
  closeAddModal() {
    this.showAddModal = false;
  }
  
  onFileSelected(event: any) {
    const file = event.target.files && event.target.files[0];
    if (file) {
      this.newDataset.file = file;
    }
  }
  
  submitAddDataset() {
    if (!this.newDataset.name || !this.newDataset.description || !this.newDataset.classesRaw || !this.newDataset.file) {
      this.addError = 'All fields are required.';
      return;
    }
    this.isSubmitting = true;
    this.addError = '';
    const formData = new FormData();
    formData.append('name', this.newDataset.name);
    formData.append('description', this.newDataset.description);
    formData.append('classesRaw', this.newDataset.classesRaw);
    formData.append('file', this.newDataset.file);
    this.datasetsService.createDataset(formData).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.closeAddModal();
        this.ngOnInit(); // refresh list
      },
      error: err => {
        this.isSubmitting = false;
        this.addError = err?.error?.message || 'Failed to add dataset.';
      }
    });
  }

  openAssignModal(datasetId: number) {
    this.showAssignModal = true;
    this.assignDatasetId = datasetId;
    this.selectedAnnotatorIds = [];
    this.assignmentDeadline = '';
    this.assignError = '';

    // Charger tous les annotateurs actifs
    this.annotatorsService.getAnnotators().subscribe({
      next: (response) => {
        if (response && Array.isArray(response)) {
          // Filtrer pour n'avoir que les annotateurs actifs (non supprimés)
          this.annotators = response.filter((a: Annotator) => !a.deleted);
          
          if (this.annotators.length < 3) {
            this.assignError = 'Il n\'y a pas assez d\'annotateurs disponibles. Minimum 3 annotateurs requis.';
          }
        } else {
          this.annotators = [];
          this.assignError = 'Aucun annotateur disponible.';
        }
      },
      error: (error) => {
        console.error('Error loading annotators:', error);
        this.assignError = 'Erreur lors du chargement des annotateurs';
        this.annotators = [];
      }
    });
  }
  
  closeAssignModal() {
    this.showAssignModal = false;
    this.assignDatasetId = null;
  }
  
  submitAssign() {
    if (!this.assignDatasetId || this.assignSelectedAnnotators.length < 3 || !this.assignDeadline) {
      this.assignError = 'Sélectionnez au moins 3 annotateurs et une deadline.';
      return;
    }
    this.assignLoading = true;
    this.assignError = '';
    const body = {
      annotatorIds: this.assignSelectedAnnotators,
      deadline: new Date(this.assignDeadline).getTime()
    };
    this.datasetsService.assignTask(this.assignDatasetId, body).subscribe({
      next: () => {
        this.assignLoading = false;
        this.closeAssignModal();
        this.ngOnInit();
      },
      error: err => {
        this.assignLoading = false;
        this.assignError = err?.error?.error || 'Erreur lors de l\'assignation.';
      }
    });
  }

  onAnnotatorSelectionChange(event: any, annotatorId: number) {
    if (event.target.checked) {
      if (this.selectedAnnotatorIds.length < 3) {
        this.selectedAnnotatorIds.push(annotatorId);
      }
    } else {
      this.selectedAnnotatorIds = this.selectedAnnotatorIds.filter(id => id !== annotatorId);
    }
  }

  removeAnnotator(annotatorId: number) {
    this.selectedAnnotatorIds = this.selectedAnnotatorIds.filter(id => id !== annotatorId);
  }

  getAnnotatorName(annotatorId: number): string {
    const annotator = this.annotators.find(a => a.id === annotatorId);
    return annotator ? `${annotator.prenom} ${annotator.nom}` : '';
  }

  getStatus(dataset: Dataset): string {
    console.log('Getting status for dataset:', dataset);
    const status = dataset.tasks && dataset.tasks.length > 0 ? 'Assigned' : 'Unassigned';
    console.log('Status:', status);
    return status;
  }

  getStatusClass(dataset: Dataset): string {
    const statusClass = dataset.tasks && dataset.tasks.length > 0 ? 'status-assigned' : 'status-unassigned';
    console.log('Status class:', statusClass);
    return statusClass;
  }

  // Updated method to use API data
  getProgress(dataset: Dataset): number {
    const status = this.datasetAnnotationStatuses.get(dataset.id);
    if (status) {
      return parseFloat(status.completionPercentage);
    }
    
    // Fallback to old calculation if API data not available
    const totalCouples = this.getTotalCouplesCount(dataset);
    if (totalCouples === 0) {
      return 0;
    }
    const annotatedCouples = this.getAnnotatedCouplesCount(dataset);
    return (annotatedCouples / totalCouples) * 100;
  }

  // Updated method to use API data
  getTotalCouplesCount(dataset: Dataset): number {
    const status = this.datasetAnnotationStatuses.get(dataset.id);
    if (status) {
      return status.totalCouples;
    }
    
    // Fallback to old calculation if API data not available
    if (!dataset.tasks) {
      return 0;
    }
    return dataset.tasks.reduce((total, task) => {
      return total + (task.couples?.length || 0);
    }, 0);
  }

  // Updated method to use API data
  getAnnotatedCouplesCount(dataset: Dataset): number {
    const status = this.datasetAnnotationStatuses.get(dataset.id);
    if (status) {
      return status.annotationsCount;
    }
    
    // Fallback to old calculation if API data not available
    if (!dataset.tasks) {
      return 0;
    }
    return dataset.tasks.reduce((total, task) => {
      if (!task.couples) return total;
      return total + task.couples.filter(couple => 
        couple.chosenClass !== undefined && couple.chosenClass !== null
      ).length;
    }, 0);
  }

  assignDataset() {
    if (this.selectedAnnotatorIds.length === 0 || !this.assignmentDeadline || !this.assignDatasetId) {
      this.assignError = 'Veuillez sélectionner au moins un annotateur et définir une date limite';
      return;
    }

    // Vérifier si le nombre d'annotateurs est suffisant selon l'API
    if (this.selectedAnnotatorIds.length < 3) {
      this.assignError = 'Vous devez sélectionner au moins 3 annotateurs';
      return;
    }

    this.assignSubmitting = true;
    this.assignError = '';

    // Créer un payload avec tous les IDs des annotateurs et la date limite
    const payload = {
      annotatorIds: this.selectedAnnotatorIds,
      deadline: new Date(this.assignmentDeadline).getTime()
    };

    // Envoyer une seule requête pour tous les annotateurs
    this.datasetsService.assignTask(this.assignDatasetId, payload).subscribe({
      next: (result) => {
        this.closeAssignModal();
        this.loadDatasets(); // Recharger les données
        this.assignSubmitting = false;
      },
      error: (err) => {
        console.error('Error assigning dataset:', err);
        this.assignError = err?.error?.error || 'Une erreur est survenue lors de l\'assignation du jeu de données.';
        this.assignSubmitting = false;
      }
    });
  }
}