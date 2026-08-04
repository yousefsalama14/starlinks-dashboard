import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FieldType, FieldTypeConfig, FormlyAttributes, FormlyFieldProps } from '@ngx-formly/core';
import { TranslatePipe } from '@ngx-translate/core';
import { InputText } from 'primeng/inputtext';

interface PasswordFieldProps extends FormlyFieldProps {}

/**
 * `@ngx-formly/primeng` ships no `password` type, so this registers one
 * (see app.config.ts) wrapping a plain `pInputText` with a visibility
 * toggle. Binding `[type]` on a single persistent `<input>` (rather than
 * swapping elements) is what keeps focus, caret position, and the field
 * value intact across a toggle.
 */
@Component({
  selector: 'formly-field-password',
  imports: [FormlyAttributes, InputText, ReactiveFormsModule, TranslatePipe],
  templateUrl: './formly-password-field.component.html',
  styleUrl: './formly-password-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FormlyPasswordFieldComponent extends FieldType<FieldTypeConfig<PasswordFieldProps>> {
  protected readonly isVisible = signal(false);

  protected toggleVisibility(): void {
    this.isVisible.update((value) => !value);
  }
}
