import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, UntypedFormGroup } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormlyFieldConfig, FormlyForm } from '@ngx-formly/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { AuthFeedbackDialogComponent } from '../../components/auth-feedback-dialog/auth-feedback-dialog.component';
import { AuthFooterComponent } from '../../components/auth-footer/auth-footer.component';
import { AuthLayoutComponent } from '../../components/auth-layout/auth-layout.component';
import { PasswordRequirementsComponent } from '../../components/password-requirements/password-requirements.component';
import {
  AUTH_FORGOT_PASSWORD_ROUTE,
  AUTH_LOGIN_ROUTE,
  RESET_PASSWORD_TOKEN_QUERY_PARAM,
} from '../../constants/auth-routes.constants';
import { AuthErrorCode } from '../../contracts/auth-error.contract';
import { AuthFacade } from '../../data-access/auth.facade';
import {
  ResetPasswordFormModel,
  ResetPasswordFormValue,
} from '../../models/reset-password-form.model';

type TokenErrorKind = 'invalid' | 'expired';

@Component({
  selector: 'app-reset-password',
  imports: [
    AuthFeedbackDialogComponent,
    AuthFooterComponent,
    AuthLayoutComponent,
    FormlyForm,
    PasswordRequirementsComponent,
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordComponent {
  private readonly authFacade = inject(AuthFacade);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly token = this.route.snapshot.queryParamMap.get(RESET_PASSWORD_TOKEN_QUERY_PARAM);

  protected readonly form = new UntypedFormGroup({});
  protected readonly formModel = ResetPasswordFormModel.createDefault();
  protected readonly fields: FormlyFieldConfig[] = this.formModel.getFormlyConfig(this.translate);

  private readonly formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.value as Partial<ResetPasswordFormValue>,
  });
  protected readonly newPasswordValue = computed(() => this.formValue()?.newPassword ?? '');

  protected readonly isSubmitting = this.authFacade.isSubmitting;
  protected readonly tokenError = signal<TokenErrorKind | null>(this.token ? null : 'invalid');
  protected readonly showSuccessDialog = signal(false);

  constructor() {
    if (this.tokenError()) {
      this.form.disable();
      return;
    }
    // Token is present but not yet known-good — check without consuming it,
    // so an invalid/expired link shows an error before the user types anything.
    this.authFacade.validateResetToken(this.token as string).subscribe({
      error: (error: unknown) => this.applyTokenError(error),
    });
  }

  protected onSubmit(): void {
    if (this.authFacade.isSubmitting() || !this.token || this.tokenError()) {
      return;
    }
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    const value = this.form.getRawValue() as ResetPasswordFormValue;
    this.authFacade
      .resetPassword({
        token: this.token,
        newPassword: value.newPassword,
        confirmPassword: value.confirmPassword,
      })
      .subscribe({
        next: () => this.showSuccessDialog.set(true),
        error: (error: unknown) => this.handleResetFailure(error),
      });
  }

  protected onSuccessConfirmed(): void {
    this.showSuccessDialog.set(false);
    this.authFacade.clearError();
    void this.router.navigateByUrl(AUTH_LOGIN_ROUTE);
  }

  protected goToForgotPassword(): void {
    this.authFacade.clearError();
    void this.router.navigateByUrl(AUTH_FORGOT_PASSWORD_ROUTE);
  }

  private handleResetFailure(error: unknown): void {
    const code = this.extractErrorCode(error);
    if (code === 'AUTH_RESET_TOKEN_INVALID' || code === 'AUTH_RESET_TOKEN_EXPIRED') {
      this.applyTokenError(error);
    }
    this.clearPasswordFields();
  }

  private applyTokenError(error: unknown): void {
    const code = this.extractErrorCode(error);
    this.tokenError.set(code === 'AUTH_RESET_TOKEN_EXPIRED' ? 'expired' : 'invalid');
    this.form.disable();
  }

  private clearPasswordFields(): void {
    for (const key of ['newPassword', 'confirmPassword']) {
      const control = this.form.get(key);
      control?.setValue('');
      control?.markAsPristine();
      control?.markAsUntouched();
    }
  }

  private extractErrorCode(error: unknown): AuthErrorCode | null {
    if (
      typeof error === 'object' &&
      error !== null &&
      typeof (error as { code?: unknown }).code === 'string'
    ) {
      return (error as { code: AuthErrorCode }).code;
    }
    return null;
  }
}
