import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  computed,
  input,
  output,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Dialog } from 'primeng/dialog';

export type AuthFeedbackVariant = 'success' | 'error';

/**
 * One reusable dialog for every success/error feedback moment in auth
 * (reset email sent, reset completed, invalid credentials, invalid/expired
 * link, generic error). Built on PrimeNG's Dialog for its built-in focus
 * trap / focus restore / escape handling rather than reimplementing those.
 */
@Component({
  selector: 'app-auth-feedback-dialog',
  imports: [Dialog, TranslatePipe],
  templateUrl: './auth-feedback-dialog.component.html',
  styleUrl: './auth-feedback-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AuthFeedbackDialogComponent {
  readonly visible = input(false);
  readonly variant = input<AuthFeedbackVariant>('success');
  readonly titleKey = input.required<string>();
  readonly messageKey = input.required<string>();
  readonly actionLabelKey = input.required<string>();
  readonly dismissible = input(false);
  readonly closeOnEscape = input(false);

  readonly action = output<void>();
  readonly visibleChange = output<boolean>();
  readonly closed = output<void>();

  protected readonly iconName = computed(() =>
    this.variant() === 'success' ? 'tick-circle' : 'danger',
  );

  protected onVisibleChange(value: boolean): void {
    this.visibleChange.emit(value);
    if (!value) {
      this.closed.emit();
    }
  }

  protected onAction(): void {
    this.action.emit();
  }
}
