import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-user-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-history.component.html',
  styleUrl: './user-history.component.css',
  encapsulation: ViewEncapsulation.None
})
export class UserHistoryComponent implements OnInit {
  historyAnnotations: any[] = [];
  userName: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // Appliquer le dark mode si nécessaire
    this.checkDarkMode();
    
    this.http.get<any>('http://localhost:8080/api/user/history').subscribe({
      next: (data) => {
        this.userName = data.userName || '';
        let mainObjs = (data.annotations || []).filter((a: any) => typeof a === 'object');
        let annotateurObjs: any[] = [];
        if (mainObjs.length > 0 && mainObjs[0].annotateur && Array.isArray(mainObjs[0].annotateur.annotations)) {
          annotateurObjs = mainObjs[0].annotateur.annotations.filter((a: any) => typeof a === 'object');
        }
        const allObjs = [...mainObjs, ...annotateurObjs];
        const uniqueObjs = allObjs.filter((obj, index, self) =>
          obj && obj.id && self.findIndex(o => o.id === obj.id) === index
        );
        this.historyAnnotations = uniqueObjs;
      },
      error: () => {
        this.historyAnnotations = [];
        this.userName = '';
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
} 