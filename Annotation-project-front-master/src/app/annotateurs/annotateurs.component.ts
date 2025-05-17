import { Component, OnInit } from '@angular/core';
import { AdminAnnotatorsService, Annotator } from '../admin-annotators.service';
import { NgClass, NgIf } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-annotators',
  templateUrl: './annotateurs.component.html',
  styleUrls: ['./annotateurs.component.css'],
  standalone: true,
  imports: [
    NgClass,
    CommonModule,
    FormsModule,
    NgIf
  ]
})
export class AnnotatorsComponent implements OnInit {
  annotators: Annotator[] = [];
  loading = true;
  showModal = false;
  isEditMode = false;
  notification = {
    show: false,
    message: '',
    type: 'success'
  };
  newAnnotator: Annotator = {
    nom: '',
    prenom: '',
    login: ''
  };
  updatingStatus: { [id: number]: boolean } = {};
  searchTerm: string = '';
  showFilterMenu: boolean = false;
  filters = {
    active: false,
    inactive: false
  };
  sortBy: string = 'name';
  filteredAnnotators: Annotator[] = [];
  searchTimeout: any;

  // Constante pour les statistiques
  private MAX_EXPECTED_ANNOTATIONS = 100; // Nombre maximal d'annotations attendu pour un annotateur

  constructor(private annotatorsService: AdminAnnotatorsService) {}

  ngOnInit() {
    this.loadAnnotators();
  }

  showNotification(message: string, type: 'success' | 'error' = 'success') {
    this.notification = {
      show: true,
      message,
      type
    };
    setTimeout(() => {
      this.notification.show = false;
    }, 3000);
  }

  get activeAnnotatorsCount(): number {
    return this.annotators.filter(a => !a.deleted).length;
  }

  get inactiveAnnotatorsCount(): number {
    return this.annotators.filter(a => a.deleted).length;
  }

  loadAnnotators() {
    this.loading = true;
    this.annotatorsService.getAnnotators().subscribe({
      next: (data: any) => {
        this.annotators = Array.isArray(data) ? data : data.annotateurs || data.data || [];
        this.filteredAnnotators = [...this.annotators];
        this.updateStats();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading annotators:', error);
        this.loading = false;
        this.showNotification('Error loading annotators', 'error');
      }
    });
  }

  /**
   * Obtient le nombre d'annotations réalisées par un annotateur
   */
  getAnnotationCount(annotator: Annotator): string {
    const count = annotator.annotations?.length || 0;
    
    // Si l'annotateur a des tâches assignées, on peut afficher le nombre d'annotations par rapport au total
    if (annotator.taches && annotator.taches.length > 0) {
      const totalPossible = annotator.taches.length * 10; // Estimation: 10 couples par tâche en moyenne
      return `${count} / ~${totalPossible}`;
    }
    
    return `${count} annotations`;
  }

  /**
   * Calcule la largeur de la barre de progression en pourcentage
   */
  getProgressWidth(annotator: Annotator): string {
    const count = annotator.annotations?.length || 0;
    
    // Si l'annotateur a des tâches assignées, calculer le pourcentage par rapport au nombre de tâches
    if (annotator.taches && annotator.taches.length > 0) {
      const totalPossible = annotator.taches.length * 10; // Estimation: 10 couples par tâche en moyenne
      const percentage = Math.min(100, Math.round((count / totalPossible) * 100));
      return `${percentage}%`;
    }
    
    // Sinon, utiliser une échelle relative basée sur le nombre maximal attendu
    const percentage = Math.min(100, Math.round((count / this.MAX_EXPECTED_ANNOTATIONS) * 100));
    return `${percentage}%`;
  }

  /**
   * Génère un texte descriptif pour le progrès d'annotation
   */
  getAnnotationProgressText(annotator: Annotator): string {
    const count = annotator.annotations?.length || 0;
    
    if (count === 0) {
      return "Aucune annotation";
    } else if (count < 10) {
      return "Débutant";
    } else if (count < 30) {
      return "En progression";
    } else if (count < 50) {
      return "Intermédiaire";
    } else if (count < 80) {
      return "Avancé";
    } else {
      return "Expert";
    }
  }

  openAddModal() {
    this.isEditMode = false;
    this.newAnnotator = {
      nom: '',
      prenom: '',
      login: ''
    };
    this.showModal = true;
  }

  openEditModal(annotator: Annotator) {
    this.isEditMode = true;
    this.newAnnotator = { ...annotator };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.isEditMode = false;
    this.newAnnotator = {
      nom: '',
      prenom: '',
      login: ''
    };
  }

  addAnnotator() {
    this.annotatorsService.createOrUpdateAnnotator(this.newAnnotator).subscribe({
      next: (response) => {
        this.showNotification(this.isEditMode ? 'Annotator updated successfully' : 'Annotator added successfully');
        this.closeModal();
        this.loadAnnotators();
      },
      error: (error) => {
        console.error('Error saving annotator:', error);
        this.showNotification('Error saving annotator', 'error');
      }
    });
  }

  updateAnnotatorStatus(id: number, deleted: boolean) {
    this.updatingStatus[id] = true;
    this.annotatorsService.updateAnnotatorStatus(id, deleted).subscribe({
      next: (response) => {
        const annotator = this.annotators.find(a => a.id === id);
        if (annotator) {
          annotator.deleted = deleted;
        }
        this.showNotification(`Annotator ${!deleted ? 'activated' : 'deactivated'} successfully`);
        this.updatingStatus[id] = false;
        },
        error: (error) => {
        console.error('Error updating annotator status:', error);
        this.showNotification('Error updating annotator status', 'error');
        this.updatingStatus[id] = false;
      }
    });
  }

  onToggleStatus(a: Annotator, event: Event) {
    const input = event.target as HTMLInputElement;
    const newDeleted = !input.checked;
    if (a.id) {
      this.updateAnnotatorStatus(a.id, newDeleted);
    }
  }

  toggleFilterMenu() {
    this.showFilterMenu = !this.showFilterMenu;
  }

  onSearch() {
    // Debounce the search to avoid too many updates
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    this.searchTimeout = setTimeout(() => {
      this.applyFilters();
    }, 300);
  }

  applyFilters() {
    let result = [...this.annotators];

    // Apply search filter
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase().trim();
      result = result.filter(annotator => 
        annotator.login?.toLowerCase().includes(searchLower) ||
        annotator.nom?.toLowerCase().includes(searchLower) ||
        annotator.prenom?.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filters
    if (this.filters.active || this.filters.inactive) {
      result = result.filter(annotator => {
        if (this.filters.active && !annotator.deleted) return true;
        if (this.filters.inactive && annotator.deleted) return true;
        return false;
      });
    }

    // Apply sorting
    if (this.sortBy === 'name') {
      result.sort((a, b) => {
        const nameA = `${a.prenom || ''} ${a.nom || ''}`.toLowerCase();
        const nameB = `${b.prenom || ''} ${b.nom || ''}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });
    } else if (this.sortBy === 'status') {
      result.sort((a, b) => {
        if (a.deleted === b.deleted) return 0;
        return a.deleted ? 1 : -1;
      });
    }

    this.filteredAnnotators = result;
    this.showFilterMenu = false;
  }

  clearFilters() {
    this.searchTerm = '';
    this.filters = {
      active: false,
      inactive: false
    };
    this.sortBy = 'name';
    this.filteredAnnotators = [...this.annotators];
  }

  onFilterChange() {
    let result = [...this.annotators];

    // Apply search filter
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase().trim();
      result = result.filter(annotator => 
        annotator.login?.toLowerCase().includes(searchLower) ||
        annotator.nom?.toLowerCase().includes(searchLower) ||
        annotator.prenom?.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filters
    if (this.filters.active || this.filters.inactive) {
      result = result.filter(annotator => {
        if (this.filters.active && !annotator.deleted) return true;
        if (this.filters.inactive && annotator.deleted) return true;
        return false;
      });
    }

    // Apply sorting
    if (this.sortBy === 'name') {
      result.sort((a, b) => {
        const nameA = `${a.prenom || ''} ${a.nom || ''}`.toLowerCase();
        const nameB = `${b.prenom || ''} ${b.nom || ''}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });
    } else if (this.sortBy === 'status') {
      result.sort((a, b) => {
        if (a.deleted === b.deleted) return 0;
        return a.deleted ? 1 : -1;
      });
    }

    this.filteredAnnotators = result;
  }

  updateStats() {
    // Update the filtered annotators count
    this.filteredAnnotators = [...this.annotators];
    this.applyFilters();
  }
}
