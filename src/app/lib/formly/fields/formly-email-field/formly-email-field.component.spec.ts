import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';

import { FormlyEmailFieldComponent } from './formly-email-field.component';

describe('FormlyEmailFieldComponent', () => {
  async function createField(formControl = new FormControl('')) {
    await TestBed.configureTestingModule({
      imports: [FormlyEmailFieldComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(FormlyEmailFieldComponent);
    const field = {
      key: 'email',
      formControl,
      props: { label: 'Email', placeholder: 'you@example.com' },
      options: { showError: () => false },
    } as FormlyFieldConfig;
    fixture.componentRef.setInput('field', field);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, formControl };
  }

  it('renders an email-type input with a leading, decorative icon', async () => {
    const { fixture } = await createField();
    const root: HTMLElement = fixture.nativeElement;
    const input = root.querySelector<HTMLInputElement>('input');
    const icon = root.querySelector('iconsax-icon');

    expect(input?.type).toBe('email');
    expect(icon?.getAttribute('name')).toBe('sms');
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
  });

  it('passes the placeholder through from field props', async () => {
    const { fixture } = await createField();
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector<HTMLInputElement>('input')?.placeholder).toBe('you@example.com');
  });

  it('reflects the current value and disables when the control is disabled', async () => {
    const { fixture, formControl } = await createField(new FormControl('a@b.com'));
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector<HTMLInputElement>('input')?.value).toBe('a@b.com');

    formControl.disable();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(root.querySelector<HTMLInputElement>('input')?.disabled).toBe(true);
  });
});
