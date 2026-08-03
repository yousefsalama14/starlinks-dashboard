import { Validators } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { TranslateService } from '@ngx-translate/core';

import { ForgotPasswordRequest } from '../contracts/forgot-password-request.contract';

export class ForgotPasswordFormModel implements ForgotPasswordRequest {
  email: string;

  private constructor(data: ForgotPasswordRequest) {
    this.email = data.email;
  }

  static create(data: ForgotPasswordRequest): ForgotPasswordFormModel {
    return new ForgotPasswordFormModel(data);
  }

  static createDefault(): ForgotPasswordFormModel {
    return new ForgotPasswordFormModel({ email: '' });
  }

  getFormlyConfig(translate: TranslateService): FormlyFieldConfig[] {
    return [
      {
        key: 'email',
        type: 'email',
        props: {
          label: translate.instant('STARLINKS.COMMON.EMAIL'),
          placeholder: translate.instant('STARLINKS.AUTH.FORGOT_PASSWORD.EMAIL_PLACEHOLDER'),
          required: true,
          hideRequiredMarker: true,
          attributes: { autocomplete: 'username' },
        },
        expressions: {
          'props.label': translate.stream('STARLINKS.COMMON.EMAIL'),
          'props.placeholder': translate.stream('STARLINKS.AUTH.FORGOT_PASSWORD.EMAIL_PLACEHOLDER'),
        },
        validators: {
          validation: [Validators.email],
        },
        validation: {
          messages: {
            required: () => translate.stream('STARLINKS.AUTH.VALIDATION.EMAIL_REQUIRED'),
            email: () => translate.stream('STARLINKS.AUTH.VALIDATION.EMAIL_INVALID'),
          },
        },
      },
    ];
  }
}
