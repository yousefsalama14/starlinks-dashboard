import { Validators } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { TranslateService } from '@ngx-translate/core';

import { LoginRequest } from '../contracts/login-request.contract';

export class LoginFormModel implements LoginRequest {
  email: string;
  password: string;
  rememberMe: boolean;

  private constructor(data: LoginRequest) {
    this.email = data.email;
    this.password = data.password;
    this.rememberMe = data.rememberMe;
  }

  static create(data: LoginRequest): LoginFormModel {
    return new LoginFormModel(data);
  }

  static createDefault(): LoginFormModel {
    return new LoginFormModel({ email: '', password: '', rememberMe: false });
  }

  getFormlyConfig(translate: TranslateService): FormlyFieldConfig[] {
    return [
      {
        key: 'email',
        type: 'email',
        className: 'mb-3 block',
        props: {
          label: translate.instant('STARLINKS.COMMON.EMAIL'),
          placeholder: translate.instant('STARLINKS.AUTH.LOGIN.EMAIL_PLACEHOLDER'),
          required: true,
          hideRequiredMarker: true,
          attributes: { autocomplete: 'username' },
        },
        expressions: {
          'props.label': translate.stream('STARLINKS.COMMON.EMAIL'),
          'props.placeholder': translate.stream('STARLINKS.AUTH.LOGIN.EMAIL_PLACEHOLDER'),
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
      {
        key: 'password',
        type: 'password',
        className: 'mb-3 block',
        props: {
          label: translate.instant('STARLINKS.COMMON.PASSWORD'),
          placeholder: translate.instant('STARLINKS.AUTH.LOGIN.PASSWORD_PLACEHOLDER'),
          required: true,
          hideRequiredMarker: true,
          attributes: { autocomplete: 'current-password' },
        },
        expressions: {
          'props.label': translate.stream('STARLINKS.COMMON.PASSWORD'),
          'props.placeholder': translate.stream('STARLINKS.AUTH.LOGIN.PASSWORD_PLACEHOLDER'),
        },
        validation: {
          messages: {
            required: () => translate.stream('STARLINKS.AUTH.VALIDATION.PASSWORD_REQUIRED'),
          },
        },
      },
      {
        key: 'rememberMe',
        type: 'checkbox',
        defaultValue: false,
        props: {
          label: translate.instant('STARLINKS.AUTH.LOGIN.REMEMBER_ME'),
        },
        expressions: {
          'props.label': translate.stream('STARLINKS.AUTH.LOGIN.REMEMBER_ME'),
        },
      },
    ];
  }
}
