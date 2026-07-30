import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { NotFoundComponent } from './not-found.component';

describe('NotFoundComponent', () => {
  it('renders a link back to Home', async () => {
    await TestBed.configureTestingModule({
      imports: [NotFoundComponent],
      providers: [provideRouter([]), provideTranslateService({ fallbackLang: 'en', lang: 'en' })],
    }).compileComponents();

    const fixture = TestBed.createComponent(NotFoundComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.not-found__code').textContent).toContain('404');
    expect(fixture.nativeElement.querySelector('a').getAttribute('href')).toBe('/app/home');
  });
});
