import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { DEFAULT_AUTHENTICATED_ROUTE } from '../constants/auth-routes.constants';
import { AuthFacade } from '../data-access/auth.facade';

/**
 * Protects login/forgot-password/reset-password from already-authenticated
 * users, sending them straight to the app instead.
 */
export const guestGuard: CanActivateFn = () => {
  const authFacade = inject(AuthFacade);
  const router = inject(Router);

  return authFacade
    .initialize()
    .pipe(
      map(() =>
        authFacade.isAuthenticated() ? router.createUrlTree([DEFAULT_AUTHENTICATED_ROUTE]) : true,
      ),
    );
};
