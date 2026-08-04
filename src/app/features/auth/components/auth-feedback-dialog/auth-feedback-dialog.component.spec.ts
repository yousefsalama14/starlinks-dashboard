import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { AuthFeedbackDialogComponent } from './auth-feedback-dialog.component';

describe('AuthFeedbackDialogComponent', () => {
  async function createFixture(
    overrides: {
      visible?: boolean;
      variant?: 'success' | 'error';
      dismissible?: boolean;
    } = {},
  ) {
    await TestBed.configureTestingModule({
      imports: [AuthFeedbackDialogComponent],
      providers: [provideTranslateService({ fallbackLang: 'en', lang: 'en' })],
    }).compileComponents();

    const fixture = TestBed.createComponent(AuthFeedbackDialogComponent);
    fixture.componentRef.setInput('visible', overrides.visible ?? true);
    fixture.componentRef.setInput('variant', overrides.variant ?? 'success');
    fixture.componentRef.setInput('titleKey', 'STARLINKS.AUTH.RESET_PASSWORD.SUCCESS_TITLE');
    fixture.componentRef.setInput('messageKey', 'STARLINKS.AUTH.RESET_PASSWORD.SUCCESS_MESSAGE');
    fixture.componentRef.setInput('actionLabelKey', 'STARLINKS.AUTH.RESET_PASSWORD.BACK_TO_LOGIN');
    if (overrides.dismissible !== undefined) {
      fixture.componentRef.setInput('dismissible', overrides.dismissible);
    }
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  afterEach(() => {
    document.querySelectorAll('.p-dialog-mask').forEach((el) => el.remove());
  });

  it('renders the translated title, message, and action label when visible', async () => {
    await createFixture({ variant: 'success' });
    const text = document.body.textContent ?? '';
    expect(text).toContain('STARLINKS.AUTH.RESET_PASSWORD.SUCCESS_TITLE');
    expect(text).toContain('STARLINKS.AUTH.RESET_PASSWORD.SUCCESS_MESSAGE');
    expect(text).toContain('STARLINKS.AUTH.RESET_PASSWORD.BACK_TO_LOGIN');
  });

  it('does not render dialog content when not visible', async () => {
    await createFixture({ visible: false });
    expect(document.querySelector('.auth-feedback-dialog')).toBeNull();
  });

  it('applies the success icon-ring styling for the success variant', async () => {
    await createFixture({ variant: 'success' });
    expect(document.querySelector('.auth-feedback-dialog__icon-ring--success')).toBeTruthy();
    expect(document.querySelector('.auth-feedback-dialog__icon-ring--error')).toBeNull();
  });

  it('applies the error icon-ring styling for the error variant', async () => {
    await createFixture({ variant: 'error' });
    expect(document.querySelector('.auth-feedback-dialog__icon-ring--error')).toBeTruthy();
    expect(document.querySelector('.auth-feedback-dialog__icon-ring--success')).toBeNull();
  });

  it('emits action when the primary button is clicked', async () => {
    const fixture = await createFixture();
    let emitted = false;
    fixture.componentInstance.action.subscribe(() => (emitted = true));

    (document.querySelector('.auth-feedback-dialog__action') as HTMLButtonElement).click();

    expect(emitted).toBe(true);
  });

  it('emits visibleChange and closed when dismissed', async () => {
    const fixture = await createFixture({ dismissible: true });
    let visibleChangedTo: boolean | undefined;
    let closedEmitted = false;
    fixture.componentInstance.visibleChange.subscribe((value) => (visibleChangedTo = value));
    fixture.componentInstance.closed.subscribe(() => (closedEmitted = true));

    const closeButton = document.querySelector<HTMLButtonElement>(
      '.auth-feedback-dialog .p-dialog-close-button',
    );
    closeButton?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(visibleChangedTo).toBe(false);
    expect(closedEmitted).toBe(true);
  });

  it('hides the close button when dismissible is false', async () => {
    await createFixture({ dismissible: false });
    expect(document.querySelector('.auth-feedback-dialog .p-dialog-close-button')).toBeNull();
  });
});
