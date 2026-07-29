import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { ActivityComponent } from './activity.component';

describe('ActivityComponent', () => {
  it('renders a breadcrumb link back to Dashboard', async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityComponent],
      providers: [provideRouter([]), provideTranslateService({ fallbackLang: 'en', lang: 'en' })],
    }).compileComponents();

    const fixture = TestBed.createComponent(ActivityComponent);
    fixture.detectChanges();

    const dashboardLink = fixture.nativeElement.querySelector('nav a') as HTMLAnchorElement;
    expect(dashboardLink.getAttribute('href')).toBe('/app/dashboard');
  });
});
