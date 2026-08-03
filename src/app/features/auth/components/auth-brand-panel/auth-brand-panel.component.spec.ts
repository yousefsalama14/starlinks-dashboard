import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { AuthBrandPanelComponent } from './auth-brand-panel.component';

describe('AuthBrandPanelComponent', () => {
  it('renders the brand heading with decorative artwork hidden from screen readers', async () => {
    await TestBed.configureTestingModule({
      imports: [AuthBrandPanelComponent],
      providers: [provideTranslateService({ fallbackLang: 'en', lang: 'en' })],
    }).compileComponents();

    const fixture = TestBed.createComponent(AuthBrandPanelComponent);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;

    expect(root.textContent).toContain('STARLINKS.AUTH.BRAND.HEADING');
    expect(root.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThanOrEqual(4);
  });
});
