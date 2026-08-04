import { FormlyFieldConfig } from '@ngx-formly/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable, tap } from 'rxjs';

import { passwordMatchValidator } from '../validators/password-match.validator';
import { passwordStrengthValidator } from '../validators/password-strength.validator';

export interface ResetPasswordFormValue {
  newPassword: string;
  confirmPassword: string;
}

/**
 * The reset token is never a Formly field — it comes from the route and is
 * carried alongside this form's value when calling the facade, not through it.
 */
export class ResetPasswordFormModel implements ResetPasswordFormValue {
  newPassword: string;
  confirmPassword: string;

  private constructor(data: ResetPasswordFormValue) {
    this.newPassword = data.newPassword;
    this.confirmPassword = data.confirmPassword;
  }

  static create(data: ResetPasswordFormValue): ResetPasswordFormModel {
    return new ResetPasswordFormModel(data);
  }

  static createDefault(): ResetPasswordFormModel {
    return new ResetPasswordFormModel({ newPassword: '', confirmPassword: '' });
  }

  getFormlyConfig(translate: TranslateService): FormlyFieldConfig[] {
    return [
      {
        key: 'newPassword',
        type: 'password',
        props: {
          label: translate.instant('STARLINKS.AUTH.RESET_PASSWORD.NEW_PASSWORD_LABEL'),
          placeholder: translate.instant('STARLINKS.AUTH.RESET_PASSWORD.NEW_PASSWORD_PLACEHOLDER'),
          required: true,
          hideRequiredMarker: true,
          attributes: { autocomplete: 'new-password' },
        },
        expressions: {
          'props.label': translate.stream('STARLINKS.AUTH.RESET_PASSWORD.NEW_PASSWORD_LABEL'),
          'props.placeholder': translate.stream(
            'STARLINKS.AUTH.RESET_PASSWORD.NEW_PASSWORD_PLACEHOLDER',
          ),
        },
        validators: {
          validation: [passwordStrengthValidator()],
        },
        validation: {
          messages: {
            required: () => translate.stream('STARLINKS.AUTH.VALIDATION.PASSWORD_REQUIRED'),
            passwordPolicy: () => translate.stream('STARLINKS.AUTH.VALIDATION.PASSWORD_POLICY'),
          },
        },
        // Confirm's own mismatch validator only re-runs on ITS OWN value changes;
        // this re-triggers it whenever the original password changes too.
        hooks: {
          onInit: (field): Observable<string> | undefined => {
            const newPasswordControl = field.formControl;
            const confirmControl = newPasswordControl?.parent?.get('confirmPassword');
            if (!newPasswordControl || !confirmControl) {
              return undefined;
            }
            return newPasswordControl.valueChanges.pipe(
              tap(() => confirmControl.updateValueAndValidity({ onlySelf: true })),
            );
          },
        },
      },
      {
        key: 'confirmPassword',
        type: 'password',
        props: {
          label: translate.instant('STARLINKS.AUTH.RESET_PASSWORD.CONFIRM_PASSWORD_LABEL'),
          placeholder: translate.instant(
            'STARLINKS.AUTH.RESET_PASSWORD.CONFIRM_PASSWORD_PLACEHOLDER',
          ),
          required: true,
          hideRequiredMarker: true,
          attributes: { autocomplete: 'new-password' },
        },
        expressions: {
          'props.label': translate.stream('STARLINKS.AUTH.RESET_PASSWORD.CONFIRM_PASSWORD_LABEL'),
          'props.placeholder': translate.stream(
            'STARLINKS.AUTH.RESET_PASSWORD.CONFIRM_PASSWORD_PLACEHOLDER',
          ),
        },
        validators: {
          validation: [passwordMatchValidator('newPassword')],
        },
        validation: {
          messages: {
            required: () => translate.stream('STARLINKS.AUTH.VALIDATION.CONFIRM_PASSWORD_REQUIRED'),
            passwordMismatch: () => translate.stream('STARLINKS.AUTH.PASSWORD.MISMATCH'),
          },
        },
      },
    ];
  }
}
