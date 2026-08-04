import { Provider } from '@angular/core';

import { AuthRepositoryContract } from '../contracts/auth-repository.contract';
import { MockAuthRepository } from './mock-auth.repository';

/**
 * Single binding point between the abstraction and its implementation.
 * Swapping in a future HttpAuthRepository only requires changing this factory.
 */
export function provideAuthRepository(): Provider {
  return { provide: AuthRepositoryContract, useClass: MockAuthRepository };
}
