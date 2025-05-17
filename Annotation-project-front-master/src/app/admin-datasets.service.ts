import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, throwError, forkJoin } from 'rxjs';

export interface Annotateur { id: number; login: string; role: string; }
export interface Couple {
  id: number;
  text_1: string;
  text_2: string;
  originalId: number;
  chosenClass?: string;
}
export interface Task {
  id: number;
  dateLimite: string;
  annotateur: Annotateur;
  couples: Couple[];
}
export interface DatasetRaw {
  id: number;
  name: string;
  description: string;
  fileType: string;
  tasks: Task[];
}
export interface DatasetView {
  id: number;
  name: string;
  status: 'Completed' | 'In Progress' | 'Unassigned';
  progress: number; // 0 à 100
  raw: DatasetRaw;
}

export interface DatasetAnnotationStatus {
  annotationsCount: number;
  completionPercentage: string;
  totalCouples: number;
  datasetName: string;
  datasetId: number;
}

export interface DashboardStats {
  totalAnnotateurs: number;
  currentUserName: string;
  completedDatasets: number;
  temporalStats: {
    recentActiveAnnotateurs: number;
    recentAnnotations: number;
    recentActivityRate: string;
  };
  totalAnnotations: number;
  inProgressDatasets: number;
  inactiveAnnotateurs: number;
  annotationStats: {
    avgAnnotationsPerAnnotateur: string;
    completionRate: string;
  };
  datasetsProgress: {
    totalCouples: number[];
    annotatedCouples: number[];
    completionPercentages: number[];
    labels: string[];
    datasetIds: number[];
  };
  activeTasks: number;
  totalDatasets: number;
  activeAnnotateurs: number;
  unassignedDatasets: number;
}

@Injectable({ providedIn: 'root' })
export class AdminDatasetsService {
  private apiUrl = 'http://localhost:8080/api/admin/datasets';
  private tasksApiUrl = 'http://localhost:8080/api/admin/tasks';
  private statsApiUrl = 'http://localhost:8080/admin/api-statistics';
  private couplesCountApiUrl = 'http://localhost:8080/admin/datasets/couples-count';
  private annotatedCouplesApiUrl = 'http://localhost:8080/admin/datasets/annotated-couples';
  private baseAdminUrl = 'http://localhost:8080/admin';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found');
    }
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getDatasets(): Observable<DatasetView[]> {
    try {
      const headers = this.getHeaders();
      return this.http.get<any>(this.apiUrl, { headers }).pipe(
        map(res => {
          console.log('Raw API response:', res);
          if (!res || !res.datasets) {
            throw new Error('Invalid response format');
          }
          return (res.datasets || []).map((d: DatasetRaw) => {
            let status: 'Completed' | 'In Progress' | 'Unassigned' = 'Unassigned';
            let totalCouples = 0;
            let totalAnnotated = 0;

            if (d.tasks && d.tasks.length > 0) {
              totalCouples = d.tasks.reduce((sum, task) => sum + (task.couples?.length || 0), 0);
              
              totalAnnotated = d.tasks.reduce((sum, task) => {
                if (!task.couples) return sum;
                return sum + task.couples.filter(couple => 
                  couple.chosenClass !== undefined && couple.chosenClass !== null
                ).length;
              }, 0);
              
              if (totalCouples === 0) {
                status = 'Unassigned';
              } else if (totalAnnotated === totalCouples && totalAnnotated > 0) {
                status = 'Completed';
              } else if (totalAnnotated > 0) {
                status = 'In Progress';
              } else {
                status = 'Unassigned';
              }
            }

            const progress = totalCouples > 0 ? (totalAnnotated / totalCouples) * 100 : 0;

            return {
              id: d.id,
              name: d.name,
              status,
              progress,
              raw: d
            };
          });
        }),
        catchError(error => {
          console.error('Error in getDatasets:', error);
          return throwError(() => new Error(error.message || 'Failed to load datasets'));
        })
      );
    } catch (error) {
      console.error('Error setting up request:', error);
      return throwError(() => new Error('Failed to setup request'));
    }
  }

  createDataset(formData: FormData): Observable<any> {
    const headers = this.getHeaders();
    return this.http.post<any>(this.apiUrl, formData, { headers });
  }

  assignTask(datasetId: number, body: any) {
    const headers = this.getHeaders();
    return this.http.post<any>(`${this.tasksApiUrl}/datasets/${datasetId}/assign`, body, { headers });
  }

  getDatasetAnnotators(datasetId: number): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get<any>(`${this.tasksApiUrl}/datasets/${datasetId}/annotators`, { headers });
  }

  getDashboardStats(): Observable<DashboardStats> {
    const headers = this.getHeaders();
    return this.http.get<DashboardStats>(this.statsApiUrl, { headers })
      .pipe(
        catchError(error => {
          console.error('Error fetching dashboard stats:', error);
          return throwError(() => new Error('Failed to load dashboard statistics'));
        })
      );
  }

  getDatasetsCouplesCount(): Observable<{datasetsWithCouples: {[id: string]: number}, totalDatasets: number}> {
    const headers = this.getHeaders();
    return this.http.get<{datasetsWithCouples: {[id: string]: number}, totalDatasets: number}>(
      this.couplesCountApiUrl, 
      { headers }
    ).pipe(
      catchError(error => {
        console.error('Error fetching datasets couples count:', error);
        return throwError(() => new Error('Failed to load datasets couples count'));
      })
    );
  }
  
  getAnnotatedCouplesCount(): Observable<{datasetsAnnotatedCouples: {[id: string]: number}}> {
    const headers = this.getHeaders();
    return this.http.get<{datasetsAnnotatedCouples: {[id: string]: number}}>(
      this.annotatedCouplesApiUrl, 
      { headers }
    ).pipe(
      catchError(error => {
        console.error('Error fetching annotated couples count:', error);
        return throwError(() => new Error('Failed to load annotated couples count'));
      })
    );
  }
  
  getCompleteDatasetsProgress(): Observable<{
    total: {[id: string]: number},
    annotated: {[id: string]: number}
  }> {
    return forkJoin({
      totalData: this.getDatasetsCouplesCount(),
      annotatedData: this.getAnnotatedCouplesCount()
    }).pipe(
      map(result => ({
        total: result.totalData.datasetsWithCouples || {},
        annotated: result.annotatedData?.datasetsAnnotatedCouples || {}
      })),
      catchError(error => {
        console.error('Error fetching complete datasets progress:', error);
        return this.getDatasetsCouplesCount().pipe(
          map(result => ({
            total: result.datasetsWithCouples || {},
            annotated: {}
          }))
        );
      })
    );
  }

  getDatasetAnnotationStatus(datasetId: number): Observable<DatasetAnnotationStatus> {
    const headers = this.getHeaders();
    return this.http.get<DatasetAnnotationStatus>(
      `${this.baseAdminUrl}/dataset/${datasetId}/annotations/count`,
      { headers }
    ).pipe(
      catchError(error => {
        console.error(`Error fetching annotation status for dataset ${datasetId}:`, error);
        return throwError(() => new Error(`Failed to load annotation status for dataset ${datasetId}`));
      })
    );
  }
  
  getMultipleDatasetAnnotationStatuses(datasetIds: number[]): Observable<DatasetAnnotationStatus[]> {
    const requests = datasetIds.map(id => this.getDatasetAnnotationStatus(id));
    
    return forkJoin(requests).pipe(
      catchError(error => {
        console.error('Error fetching multiple dataset annotation statuses:', error);
        return throwError(() => new Error('Failed to load multiple dataset annotation statuses'));
      })
    );
  }
} 