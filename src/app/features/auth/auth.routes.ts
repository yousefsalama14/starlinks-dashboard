import { Routes } from '@angular/router';
import { provideFormlyCore } from '@ngx-formly/core';
import { withFormlyPrimeNG } from '@ngx-formly/primeng';

import { FormlyEmailFieldComponent } from '../../lib/formly/fields/formly-email-field/formly-email-field.component';
import { FormlyPasswordFieldComponent } from '../../lib/formly/fields/formly-password-field/formly-password-field.component';
import { guestGuard } from './guards/guest.guard';

/**
 * Registering the custom `password`/`email` Formly types here (rather than
 * in app.config.ts) keeps them — and their PrimeNG InputText dependency —
 * inside this route's own lazy chunk instead of the eager/initial bundle,
 * since nothing outside the auth feature references them.
 */
export const AUTH_ROUTES: Routes = [
  {
    path: '',
    providers: [
      provideFormlyCore(withFormlyPrimeNG()),
      provideFormlyCore({
        types: [
          { name: 'password', component: FormlyPasswordFieldComponent, wrappers: ['form-field'] },
          { name: 'email', component: FormlyEmailFieldComponent, wrappers: ['form-field'] },
        ],
      }),
    ],
    children: [
      {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'forgot-password',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./pages/forgot-password/forgot-password.component').then(
            (m) => m.ForgotPasswordComponent,
          ),
      },
      {
        path: 'reset-password',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./pages/reset-password/reset-password.component').then(
            (m) => m.ResetPasswordComponent,
          ),
      },
      { path: '', pathMatch: 'full', redirectTo: 'login' },
    ],
  },
];
