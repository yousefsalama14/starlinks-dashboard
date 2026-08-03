import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

import { isPasswordPolicySatisfied } from '../constants/password-policy.constants';

export function passwordStrengthValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string | null;
    if (!value) {
      return null;
    }
    return isPasswordPolicySatisfied(value) ? null : { passwordPolicy: true };
  };
}
