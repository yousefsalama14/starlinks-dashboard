import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FieldType, FieldTypeConfig, FormlyAttributes, FormlyFieldProps } from '@ngx-formly/core';
import { InputText } from 'primeng/inputtext';

interface EmailFieldProps extends FormlyFieldProps {}

/**
 * Custom Formly type for a leading-icon email input. Formly/PrimeNG's stock
 * 'input' type has no icon slot, so this mirrors FormlyPasswordFieldComponent's
 * pattern to add one just for email fields.
 */
@Component({
  selector: 'formly-field-email',
  imports: [FormlyAttributes, InputText, ReactiveFormsModule],
  templateUrl: './formly-email-field.component.html',
  styleUrl: './formly-email-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FormlyEmailFieldComponent extends FieldType<FieldTypeConfig<EmailFieldProps>> {}
