import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { AuthFooterComponent } from './auth-footer.component';

describe('AuthFooterComponent', () => {
  it('renders support, privacy policy, and copyright text', async () => {
    await TestBed.configureTestingModule({
      imports: [AuthFooterComponent],
      providers: [provideTranslateService({ fallbackLang: 'en', lang: 'en' })],
    }).compileComponents();

    const fixture = TestBed.createComponent(AuthFooterComponent);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('STARLINKS.COMMON.SUPPORT');
    expect(text).toContain('STARLINKS.COMMON.PRIVACY_POLICY');
    expect(text).toContain('STARLINKS.COMMON.COPYRIGHT');
  });
});
