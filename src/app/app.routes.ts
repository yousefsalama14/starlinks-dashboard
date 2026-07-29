import { Routes } from '@angular/router';

import { AppShellComponent } from './core/layout/app-shell/app-shell.component';

export const routes: Routes = [
  {
    path: 'app',
    component: AppShellComponent,
    children: [
      {
        path: 'home',
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
      {
        path: 'dashboard/activity',
        pathMatch: 'full',
        redirectTo: 'home/activity',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/portal/pages/placeholder/placeholder.component').then(
            (component) => component.PlaceholderComponent,
          ),
        data: { titleKey: 'STARLINKS.NAV.DASHBOARD' },
      },
      {
        path: 'shipments',
        loadComponent: () =>
          import('./features/portal/pages/placeholder/placeholder.component').then(
            (component) => component.PlaceholderComponent,
          ),
        data: { titleKey: 'STARLINKS.NAV.SHIPMENTS' },
      },
      {
        path: 'fulfillment',
        loadComponent: () =>
          import('./features/portal/pages/placeholder/placeholder.component').then(
            (component) => component.PlaceholderComponent,
          ),
        data: { titleKey: 'STARLINKS.NAV.FULFILLMENT' },
      },
      {
        path: 'surveys',
        loadComponent: () =>
          import('./features/portal/pages/placeholder/placeholder.component').then(
            (component) => component.PlaceholderComponent,
          ),
        data: { titleKey: 'STARLINKS.NAV.SURVEYS' },
      },
      {
        path: 'invoices',
        loadComponent: () =>
          import('./features/portal/pages/placeholder/placeholder.component').then(
            (component) => component.PlaceholderComponent,
          ),
        data: { titleKey: 'STARLINKS.NAV.INVOICES' },
      },
      {
        path: 'support',
        loadComponent: () =>
          import('./features/portal/pages/placeholder/placeholder.component').then(
            (component) => component.PlaceholderComponent,
          ),
        data: { titleKey: 'STARLINKS.NAV.SUPPORT' },
      },
      { path: '', pathMatch: 'full', redirectTo: 'home' },
    ],
  },
  { path: '', pathMatch: 'full', redirectTo: 'app/home' },
  { path: '**', redirectTo: 'app/home' },
];
