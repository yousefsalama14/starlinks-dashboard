import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  signal,
} from '@angular/core';
import { ReactiveFormsModule, UntypedFormGroup } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FormlyFieldConfig, FormlyForm } from '@ngx-formly/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import {
  AuthFeedbackDialogComponent,
  AuthFeedbackVariant,
} from '../../components/auth-feedback-dialog/auth-feedback-dialog.component';
import { AuthFooterComponent } from '../../components/auth-footer/auth-footer.component';
import { AuthLayoutComponent } from '../../components/auth-layout/auth-layout.component';
import { AUTH_LOGIN_ROUTE } from '../../constants/auth-routes.constants';
import { AuthFacade } from '../../data-access/auth.facade';
import { ForgotPasswordFormModel } from '../../models/forgot-password-form.model';

interface ForgotPasswordFormValue {
  email: string;
}

@Component({
  selector: 'app-forgot-password',
  imports: [
    AuthFeedbackDialogComponent,
    AuthFooterComponent,
    AuthLayoutComponent,
    FormlyForm,
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ForgotPasswordComponent {
  private readonly authFacade = inject(AuthFacade);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);

  protected readonly form = new UntypedFormGroup({});
  protected readonly formModel = ForgotPasswordFormModel.createDefault();
  protected readonly fields: FormlyFieldConfig[] = this.formModel.getFormlyConfig(this.translate);

  protected readonly isSubmitting = this.authFacade.isSubmitting;
  protected readonly showFeedbackDialog = signal(false);
  protected readonly feedbackVariant = signal<AuthFeedbackVariant>('success');

  protected onSubmit(): void {
    if (this.authFacade.isSubmitting()) {
      return;
    }
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    const value = this.form.getRawValue() as ForgotPasswordFormValue;
    this.authFacade.forgotPassword({ email: value.email.trim().toLowerCase() }).subscribe({
      next: () => this.showFeedback('success'),
      error: () => this.showFeedback('error'),
    });
  }

  protected onFeedbackDialogClosed(): void {
    const wasSuccess = this.feedbackVariant() === 'success';
    this.showFeedbackDialog.set(false);
    this.authFacade.clearError();
    if (wasSuccess) {
      void this.router.navigateByUrl(AUTH_LOGIN_ROUTE);
    }
  }

  protected onBack(): void {
    void this.router.navigateByUrl(AUTH_LOGIN_ROUTE);
  }

  private showFeedback(variant: AuthFeedbackVariant): void {
    this.feedbackVariant.set(variant);
    this.showFeedbackDialog.set(true);
  }
}
