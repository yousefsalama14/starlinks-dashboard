import { Routes } from '@angular/router';

import { AppShellComponent } from './core/layout/app-shell/app-shell.component';
import { pageRouteData } from './core/layout/page-route-data';
import { authGuard } from './features/auth/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'app',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        data: pageRouteData({ headerTitleKey: 'STARLINKS.NAV.HOME' }),
        loadComponent: () =>
          import('./features/home/pages/home/home.component').then(
            (component) => component.HomeComponent,
          ),
      },
      {
        path: 'not-found',
        data: pageRouteData({ headerTitleKey: 'STARLINKS.NOT_FOUND.HEADER_TITLE' }),
        loadComponent: () =>
          import('./features/not-found/pages/not-found/not-found.component').then(
            (component) => component.NotFoundComponent,
          ),
      },
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      { path: '**', redirectTo: 'not-found' },
    ],
  },
  { path: '', pathMatch: 'full', redirectTo: 'app/home' },
  { path: '**', redirectTo: 'app/not-found' },
];
