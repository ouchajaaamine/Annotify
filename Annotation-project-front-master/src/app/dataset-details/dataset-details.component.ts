import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {DecimalPipe} from '@angular/common';
import { CommonModule } from '@angular/common';
import {FormsModule} from '@angular/forms';

interface Annotateur { id: number; login: string; role: string; }
interface Couple { id: number; text_1: string; text_2: string; originalId: number; }
interface Task {
  id: number;
  dateLimite: string;
  annotateur: Annotateur;
  couples: Couple[];
}
interface DatasetRaw {
  id: number;
  name: string;
  description: string;
  fileType: string;
  tasks: Task[];
}
interface Annotator {
  name: string;
  hasAnnotated: boolean;
  // autres propriétés existantes...
}

@Component({
  selector: 'app-dataset-details',
  templateUrl: './dataset-details.component.html',
  styleUrls: ['./dataset-details.component.css'],
  imports: [
    DecimalPipe,
    CommonModule,
    FormsModule
  ],
  standalone: true
})
export class DatasetDetailsComponent implements OnInit {
  dataset: any = null;
  coupleTexts: any[] = [];
  loading = true;
  notFound = false;
  currentPage = 1;
  itemsPerPage = 20;
  totalPages = 1;
  datasetInfo: any = null;
  annotations: any[] = [];
  annotators: any[] = [];
  filteredPairs: any[] = [];
  annotationFilter: string = 'all';
  searchTerm: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
  ) {}

  ngOnInit() {
    const datasetId = this.route.snapshot.params['id'];
    this.loadDataset(datasetId);
  }

  loadDataset(datasetId: string) {
    this.http.get('http://localhost:8080/api/admin/datasets').subscribe({
      next: (data: any) => {
        if (data && data.datasets) {
          this.datasetInfo = data.datasets.find((d: any) => d.id == datasetId);
        }
        this.http.get(`http://localhost:8080/api/admin/datasets/details/${datasetId}?page=0&size=1000`).subscribe({
          next: (details: any) => {
            this.dataset = details;
            this.coupleTexts = (details.coupleTexts || []).map((c: any) => ({
              id: c.id,
              text_1: c.text_1,
              text_2: c.text_2
            }));
            this.totalPages = Math.ceil(this.coupleTexts.length / this.itemsPerPage);
            
            // Une seule requête pour les annotateurs
            this.http.get(`http://localhost:8080/api/admin/tasks/datasets/${datasetId}/annotators`).subscribe({
              next: (annotators: any) => {
                console.log('Raw annotators data:', annotators); // Pour debug
                this.annotators = annotators;
                this.annotations = this.annotators.flatMap(a => a.annotations || []);
              },
              error: (error) => {
                console.error('Error loading annotators:', error);
              }
            });
            
            this.loading = false;
            this.filterPairs();
          },
          error: () => {
            this.notFound = true;
            this.loading = false;
          }
        });
      },
      error: () => {
        this.notFound = true;
        this.loading = false;
      }
    });
  }

  backToList() {
    this.router.navigate(['/admin/datasets']);
  }

  getAnnotationClass(coupleId: number): string | null {
    const annotation = this.annotations.find(a => a.coupleText && a.coupleText.id === coupleId);
    return annotation ? annotation.chosenClass : null;
  }

  get totalTextPairs(): number {
    return this.dataset?.tasks?.reduce((sum: number, t: any) => sum + (t.couples?.length || 0), 0) || 0;
  }
  get assignedTextPairs(): number {
    return this.totalTextPairs; // ici, tous les couples sont assignés si présents dans tasks
  }
  get unassignedTextPairs(): number {
    return 0; // à adapter si tu as une logique d'unassigned
  }
  get progress(): number {
    // Ici, on considère que tous les couples sont annotés si présents
    return this.totalTextPairs > 0 ? 100 : 0;
  }

  isAnnotatorAnnotated(a: any): boolean {
    return (a.annotations || []).some((ann: any) => ann.coupleText);
  }

  filterPairs() {
    if (!this.coupleTexts) return;

    // Reset filtered pairs
    this.filteredPairs = [...this.coupleTexts];

    // Appliquer le filtre d'annotation
    if (this.annotationFilter !== 'all') {
      this.filteredPairs = this.filteredPairs.filter(pair => {
        const hasAnnotation = this.getAnnotationClass(pair.id) !== null;
        return this.annotationFilter === 'annotated' ? hasAnnotation : !hasAnnotation;
      });
    }

    // Appliquer la recherche
    if (this.searchTerm && this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase().trim();
      this.filteredPairs = this.filteredPairs.filter(pair => 
        pair.text_1.toLowerCase().includes(searchLower) || 
        pair.text_2.toLowerCase().includes(searchLower)
      );
    }

    // Mettre à jour le nombre total de pages
    this.totalPages = Math.ceil(this.filteredPairs.length / this.itemsPerPage);
    // Revenir à la première page après un filtrage
    this.currentPage = 1;
  }

  onSearch(event: any) {
    this.searchTerm = event.target.value;
    this.filterPairs();
  }
}
