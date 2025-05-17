import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { authGuard } from './authGuard';
import { roleGuard } from './roleGuard';
import { AppLayoutComponent } from './shared/components/layout/app-layout.component';

export let routes: Routes;
routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'admin/dashboard',
        canActivate: [roleGuard('ROLE_ADMIN_ROLE')],
        loadComponent: () => import('./admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'admin/annotateurs',
        canActivate: [roleGuard('ROLE_ADMIN_ROLE')],
        loadComponent: () => import('./annotateurs/annotateurs.component').then(m => m.AnnotatorsComponent)
      },
      {
        path: 'admin/datasets',
        canActivate: [roleGuard('ROLE_ADMIN_ROLE')],
        loadComponent: () => import('./datasets/datasets.component').then(m => m.DatasetsComponent)
      },
      {
        path: 'admin/datasets/:id',
        canActivate: [roleGuard('ROLE_ADMIN_ROLE')],
        loadComponent: () => import('./dataset-details/dataset-details.component').then(m => m.DatasetDetailsComponent)
      },
      {
        path: 'admin/datasets/details/:id',
        canActivate: [roleGuard('ROLE_ADMIN_ROLE')],
        loadComponent: () => import('./dataset-details/dataset-details.component').then(m => m.DatasetDetailsComponent)
      },
      {
        path: 'user/dashboard',
        canActivate: [roleGuard('ROLE_USER_ROLE')],
        loadComponent: () => import('./user-dashboard/user-dashboard.component').then(m => m.UserDashboardComponent)
      },
      {
        path: 'user/tasks',
        canActivate: [roleGuard('ROLE_USER_ROLE')],
        loadComponent: () => import('./tasks/tasks.component').then(m => m.TasksComponent)
      },
      {
        path: 'user/annotate/:id',
        canActivate: [roleGuard('ROLE_USER_ROLE')],
        loadComponent: () => import('./task-details/task-details.component').then(m => m.TaskDetailsComponent)
      },
      {
        path: 'user/history',
        canActivate: [roleGuard('ROLE_USER_ROLE')],
        loadComponent: () => import('./user-history/user-history.component').then(m => m.UserHistoryComponent)
      }
    ]
  },
  { path: '**', redirectTo: '/login' }
];

