import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Lives on the confirm-password control itself (not a group validator) so
 * Formly's own per-field revalidation cycle can't clobber it — Formly
 * re-runs each field's own control-level validators independently, but a
 * group validator's side effect of calling sibling.setErrors() gets
 * overwritten by that same cycle. Pair with a Formly hook on the password
 * field (see reset-password-form.model.ts) that re-triggers this validator
 * when the original password changes.
 */
export function passwordMatchValidator(passwordKey: string): ValidatorFn {
  return (confirmControl: AbstractControl): ValidationErrors | null => {
    const passwordControl = confirmControl.parent?.get(passwordKey);
    if (!passwordControl) {
      return null;
    }
    if (confirmControl.value === '' || confirmControl.value === passwordControl.value) {
      return null;
    }
    return { passwordMismatch: true };
  };
}
