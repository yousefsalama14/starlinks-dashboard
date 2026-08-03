import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { Subject, firstValueFrom, of } from 'rxjs';

import { TEST_AUTH_SESSION } from '../testing/auth-test-data';
import { provideFakeAuthRepository } from '../testing/auth-test-providers';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  function setup(restoreSessionResult?: Parameters<typeof provideFakeAuthRepository>[0]) {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideFakeAuthRepository(restoreSessionResult)],
    });
    return TestBed.inject(Router);
  }

  function runGuard(url: string) {
    return TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url } as never),
    ) as ReturnType<typeof authGuard>;
  }

  it('allows access once the session restores as authenticated', async () => {
    setup({ restoreSessionResult: () => of(TEST_AUTH_SESSION) });
    const result = await firstValueFrom(runGuard('/app/home') as never);
    expect(result).toBe(true);
  });

  it('redirects to login with a returnUrl when unauthenticated', async () => {
    setup({ restoreSessionResult: () => of(null) });
    const result = (await firstValueFrom(runGuard('/app/home') as never)) as UrlTree;
    expect(result).toBeInstanceOf(UrlTree);
    expect(result.toString()).toBe('/auth/login?returnUrl=%2Fapp%2Fhome');
  });

  it('waits for initialization before deciding', async () => {
    const restoreSubject = new Subject<null>();
    setup({ restoreSessionResult: () => restoreSubject.asObservable() });

    let settled = false;
    const promise = firstValueFrom(runGuard('/app/home') as never).then((value) => {
      settled = true;
      return value;
    });

    expect(settled).toBe(false);
    restoreSubject.next(null);
    restoreSubject.complete();
    await promise;
    expect(settled).toBe(true);
  });
});
