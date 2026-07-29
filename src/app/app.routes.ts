import { Routes } from '@angular/router';

import { AppShellComponent } from './core/layout/app-shell/app-shell.component';

export const routes: Routes = [
  {
    path: 'app',
    component: AppShellComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard-layout/dashboard-layout.component').then(
            (component) => component.DashboardLayoutComponent,
          ),
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/dashboard/pages/dashboard/dashboard.component').then(
                (component) => component.DashboardComponent,
              ),
          },
          {
            path: 'activity',
            loadComponent: () =>
              import('./features/dashboard/pages/activity/activity.component').then(
                (component) => component.ActivityComponent,
              ),
          },
        ],
      },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  { path: '', pathMatch: 'full', redirectTo: 'app/dashboard' },
  { path: '**', redirectTo: 'app/dashboard' },
];
