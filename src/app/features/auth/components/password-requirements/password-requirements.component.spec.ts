import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { PasswordRequirementsComponent } from './password-requirements.component';

describe('PasswordRequirementsComponent', () => {
  async function createFixture(password = '') {
    await TestBed.configureTestingModule({
      imports: [PasswordRequirementsComponent],
      providers: [provideTranslateService({ fallbackLang: 'en', lang: 'en' })],
    }).compileComponents();
    const fixture = TestBed.createComponent(PasswordRequirementsComponent);
    fixture.componentRef.setInput('password', password);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  it('marks every requirement as not passed for an empty password and reports empty strength', async () => {
    const fixture = await createFixture('');
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelectorAll('.password-requirements__item--passed')).toHaveLength(0);
    expect(root.querySelector('.password-strength__meter')?.getAttribute('data-level')).toBe(
      'empty',
    );
  });

  it('passes the length requirement once 8+ characters are entered', async () => {
    const fixture = await createFixture('abcdefgh');
    const items = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '.password-requirements__item',
    );
    expect(items[0].classList.contains('password-requirements__item--passed')).toBe(true);
  });

  it('passes the number requirement when a digit is present', async () => {
    const fixture = await createFixture('abc12345');
    const items = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '.password-requirements__item',
    );
    expect(items[1].classList.contains('password-requirements__item--passed')).toBe(true);
  });

  it('passes the uppercase requirement when an uppercase letter is present', async () => {
    const fixture = await createFixture('Abcdefgh');
    const items = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '.password-requirements__item',
    );
    expect(items[2].classList.contains('password-requirements__item--passed')).toBe(true);
  });

  it('passes the special character requirement when one is present', async () => {
    const fixture = await createFixture('abcdefg!');
    const items = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '.password-requirements__item',
    );
    expect(items[3].classList.contains('password-requirements__item--passed')).toBe(true);
  });

  it('marks all four requirements passed and reports strong for a fully compliant long password', async () => {
    const fixture = await createFixture('Starlinks@123');
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelectorAll('.password-requirements__item--passed')).toHaveLength(4);
    expect(root.querySelector('.password-strength__meter')?.getAttribute('data-level')).toBe(
      'strong',
    );
  });

  it('reflects the strength level in the translated label text', async () => {
    const fixture = await createFixture('Starlinks@123');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'STARLINKS.AUTH.PASSWORD.STRENGTH.STRONG',
    );
  });

  it('provides screen-reader text for both met and not-met requirement states', async () => {
    const fixture = await createFixture('abcdefgh');
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('STARLINKS.AUTH.PASSWORD.REQUIREMENT_MET');
    expect(text).toContain('STARLINKS.AUTH.PASSWORD.REQUIREMENT_NOT_MET');
  });

  it('updates reactively when the password input changes', async () => {
    const fixture = await createFixture('');
    fixture.componentRef.setInput('password', 'Starlinks@123');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(
      (fixture.nativeElement as HTMLElement).querySelectorAll(
        '.password-requirements__item--passed',
      ),
    ).toHaveLength(4);
  });
});
