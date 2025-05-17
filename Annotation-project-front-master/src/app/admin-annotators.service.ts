import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Tache {
  id: number;
  dateLimite: string;
}

export interface Annotation {
  id: number;
  annotateur: number;
  coupleText: any;
  chosenClass: string;
}

export interface Role {
  id: number;
  role: string;
}

export interface Annotator {
  id?: number;
  prenom: string;
  nom: string;
  login: string;
  deleted?: boolean;
  role?: Role;
  taches?: Tache[];
  annotations?: Annotation[];
}

@Injectable({ providedIn: 'root' })
export class AdminAnnotatorsService {
  private apiUrl = 'http://localhost:8080/api/admin/annotateurs';

  constructor(private http: HttpClient) {}

  getAnnotators(): Observable<any> {
    console.log('getAnnotators');
    return this.http.get<any>(this.apiUrl);
  }

  getAnnotator(id: number): Observable<Annotator> {
    return this.http.get<Annotator>(`${this.apiUrl}/${id}`);
  }

  createOrUpdateAnnotator(annotator: Annotator): Observable<Annotator> {
    return this.http.post<Annotator>(this.apiUrl, annotator);
  }

  deleteAnnotator(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  updateAnnotatorStatus(id: number, deleted: boolean): Observable<Annotator> {
    return this.createOrUpdateAnnotator({ id, deleted } as Annotator);
  }
}
