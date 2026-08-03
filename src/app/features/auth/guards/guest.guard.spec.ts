import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';

import { TEST_AUTH_SESSION } from '../testing/auth-test-data';
import { provideFakeAuthRepository } from '../testing/auth-test-providers';
import { guestGuard } from './guest.guard';

describe('guestGuard', () => {
  function setup(restoreSessionResult?: Parameters<typeof provideFakeAuthRepository>[0]) {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideFakeAuthRepository(restoreSessionResult)],
    });
    return TestBed.inject(Router);
  }

  function runGuard() {
    return TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never)) as ReturnType<
      typeof guestGuard
    >;
  }

  it('allows unauthenticated users to reach guest routes', async () => {
    setup({ restoreSessionResult: () => of(null) });
    const result = await firstValueFrom(runGuard() as never);
    expect(result).toBe(true);
  });

  it('redirects an already-authenticated user to the default authenticated route', async () => {
    setup({ restoreSessionResult: () => of(TEST_AUTH_SESSION) });
    const result = (await firstValueFrom(runGuard() as never)) as UrlTree;
    expect(result).toBeInstanceOf(UrlTree);
    expect(result.toString()).toBe('/app/home');
  });
});
