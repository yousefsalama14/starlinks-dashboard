import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { provideTranslateService } from '@ngx-translate/core';

import { FormlyPasswordFieldComponent } from './formly-password-field.component';

describe('FormlyPasswordFieldComponent', () => {
  async function createField(formControl = new FormControl('secret123')) {
    await TestBed.configureTestingModule({
      imports: [FormlyPasswordFieldComponent],
      providers: [provideTranslateService({ fallbackLang: 'en', lang: 'en' })],
    }).compileComponents();

    const fixture = TestBed.createComponent(FormlyPasswordFieldComponent);
    const field = {
      key: 'password',
      formControl,
      props: { label: 'Password' },
      options: { showError: () => false },
    } as FormlyFieldConfig;
    fixture.componentRef.setInput('field', field);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, formControl };
  }

  it('renders a password-type input by default', async () => {
    const { fixture } = await createField();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(input.type).toBe('password');
  });

  it('toggles to text, updates the aria-label, and back again', async () => {
    const { fixture } = await createField();
    const toggle: HTMLButtonElement = fixture.nativeElement.querySelector('button');

    toggle.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect((fixture.nativeElement.querySelector('input') as HTMLInputElement).type).toBe('text');
    expect(toggle.getAttribute('aria-label')).toContain('HIDE_PASSWORD');

    toggle.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect((fixture.nativeElement.querySelector('input') as HTMLInputElement).type).toBe(
      'password',
    );
    expect(toggle.getAttribute('aria-label')).toContain('SHOW_PASSWORD');
  });

  it('keeps the same input element and the field value across a toggle', async () => {
    const { fixture, formControl } = await createField();
    const inputBefore = fixture.nativeElement.querySelector('input');
    const toggle: HTMLButtonElement = fixture.nativeElement.querySelector('button');

    toggle.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('input')).toBe(inputBefore);
    expect(formControl.value).toBe('secret123');
  });

  it('disables both the input and the toggle when the control is disabled', async () => {
    const { fixture, formControl } = await createField();
    formControl.disable();
    fixture.detectChanges();
    await fixture.whenStable();

    expect((fixture.nativeElement.querySelector('input') as HTMLInputElement).disabled).toBe(true);
    expect((fixture.nativeElement.querySelector('button') as HTMLButtonElement).disabled).toBe(
      true,
    );
  });
});
