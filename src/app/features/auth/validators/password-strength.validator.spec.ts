import { FormControl } from '@angular/forms';

import { passwordStrengthValidator } from './password-strength.validator';

describe('passwordStrengthValidator', () => {
  const validator = passwordStrengthValidator();

  it('returns null for an empty value, leaving emptiness to `required`', () => {
    expect(validator(new FormControl(''))).toBeNull();
    expect(validator(new FormControl(null))).toBeNull();
  });

  it('returns null when the password satisfies the policy', () => {
    expect(validator(new FormControl('Starlinks@123'))).toBeNull();
  });

  it('returns a passwordPolicy error when the password fails the policy', () => {
    expect(validator(new FormControl('weak'))).toEqual({ passwordPolicy: true });
  });
});
