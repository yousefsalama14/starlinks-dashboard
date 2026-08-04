import { ChangeDetectionStrategy, Component, ElementRef, inject, signal } from '@angular/core';
import { ReactiveFormsModule, UntypedFormGroup } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormlyFieldConfig, FormlyForm } from '@ngx-formly/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { AuthFeedbackDialogComponent } from '../../components/auth-feedback-dialog/auth-feedback-dialog.component';
import { AuthFooterComponent } from '../../components/auth-footer/auth-footer.component';
import { AuthLayoutComponent } from '../../components/auth-layout/auth-layout.component';
import {
  DEFAULT_AUTHENTICATED_ROUTE,
  RETURN_URL_QUERY_PARAM,
} from '../../constants/auth-routes.constants';
import { AuthFacade } from '../../data-access/auth.facade';
import { isSafeReturnUrl } from '../../guards/return-url.util';
import { LoginFormModel } from '../../models/login-form.model';

interface LoginFormValue {
  email: string;
  password: string;
  rememberMe: boolean;
}

@Component({
  selector: 'app-login',
  imports: [
    AuthFeedbackDialogComponent,
    AuthFooterComponent,
    AuthLayoutComponent,
    FormlyForm,
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly authFacade = inject(AuthFacade);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  protected readonly form = new UntypedFormGroup({});
  protected readonly formModel = LoginFormModel.createDefault();
  protected readonly fields: FormlyFieldConfig[] = this.formModel.getFormlyConfig(this.translate);

  protected readonly isSubmitting = this.authFacade.isSubmitting;
  protected readonly showErrorDialog = signal(false);

  protected onSubmit(): void {
    if (this.authFacade.isSubmitting()) {
      return;
    }
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    const value = this.form.getRawValue() as LoginFormValue;
    this.authFacade
      .login({
        email: value.email.trim().toLowerCase(),
        password: value.password,
        rememberMe: value.rememberMe,
      })
      .subscribe({
        next: () => this.navigateAfterLogin(),
        error: () => this.handleLoginFailure(),
      });
  }

  protected onErrorDialogClosed(): void {
    this.showErrorDialog.set(false);
    this.authFacade.clearError();
    const passwordInput = this.elementRef.nativeElement.querySelector(
      '.formly-password-field input',
    ) as HTMLInputElement | null;
    passwordInput?.focus();
  }

  private navigateAfterLogin(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get(RETURN_URL_QUERY_PARAM);
    const target = isSafeReturnUrl(returnUrl) ? returnUrl : DEFAULT_AUTHENTICATED_ROUTE;
    void this.router.navigateByUrl(target);
  }

  private handleLoginFailure(): void {
    const passwordControl = this.form.get('password');
    passwordControl?.setValue('');
    passwordControl?.markAsPristine();
    passwordControl?.markAsUntouched();
    this.showErrorDialog.set(true);
  }
}
