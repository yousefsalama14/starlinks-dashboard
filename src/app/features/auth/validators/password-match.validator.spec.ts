import { FormControl, FormGroup } from '@angular/forms';

import { passwordMatchValidator } from './password-match.validator';

describe('passwordMatchValidator', () => {
  function buildGroup(confirmValue = ''): FormGroup {
    return new FormGroup({
      newPassword: new FormControl(''),
      confirmPassword: new FormControl(confirmValue, [passwordMatchValidator('newPassword')]),
    });
  }

  it('returns null while confirm is empty, regardless of the original password', () => {
    const group = buildGroup('');
    group.get('newPassword')?.setValue('Starlinks@123');
    expect(group.get('confirmPassword')?.errors).toBeNull();
  });

  it('returns null when both values match', () => {
    const group = buildGroup();
    group.get('newPassword')?.setValue('Starlinks@123');
    group.get('confirmPassword')?.setValue('Starlinks@123');
    expect(group.get('confirmPassword')?.errors).toBeNull();
  });

  it('returns a passwordMismatch error when the values differ', () => {
    const group = buildGroup();
    group.get('newPassword')?.setValue('Starlinks@123');
    group.get('confirmPassword')?.setValue('Different@123');
    expect(group.get('confirmPassword')?.errors).toEqual({ passwordMismatch: true });
  });

  it('clears the error once the confirm value is edited to match', () => {
    const group = buildGroup();
    group.get('newPassword')?.setValue('Starlinks@123');
    group.get('confirmPassword')?.setValue('Different@123');
    group.get('confirmPassword')?.setValue('Starlinks@123');
    expect(group.get('confirmPassword')?.errors).toBeNull();
  });

  it('returns null when there is no parent to compare against', () => {
    const validator = passwordMatchValidator('newPassword');
    expect(validator(new FormControl('anything'))).toBeNull();
  });
});
