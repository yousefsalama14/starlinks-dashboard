import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AUTH_LOGIN_ROUTE, RETURN_URL_QUERY_PARAM } from '../constants/auth-routes.constants';
import { AuthFacade } from '../data-access/auth.facade';

/**
 * Protects the authenticated app shell. Waits for `initialize()` (idempotent
 * — replays the cached result if already running/done) before deciding, so
 * a direct refresh on a protected route never flashes protected content.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const authFacade = inject(AuthFacade);
  const router = inject(Router);

  return authFacade.initialize().pipe(
    map(() => {
      if (authFacade.isAuthenticated()) {
        return true;
      }
      return router.createUrlTree([AUTH_LOGIN_ROUTE], {
        queryParams: { [RETURN_URL_QUERY_PARAM]: state.url },
      });
    }),
  );
};
