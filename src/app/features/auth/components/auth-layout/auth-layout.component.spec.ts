import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';

import { AuthLayoutComponent } from './auth-layout.component';

@Component({
  imports: [AuthLayoutComponent],
  template: `
    <app-auth-layout>
      <button authLayoutBack type="button">Back</button>
      <h1>Test Heading</h1>
      <p>Test Subtitle</p>
      <div authLayoutFooter>Footer content</div>
    </app-auth-layout>
  `,
})
class HostComponent {}

describe('AuthLayoutComponent', () => {
  async function createHost() {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideTranslateService({ fallbackLang: 'en', lang: 'en' }), provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('renders projected heading/subtitle content, the back action, and the footer slot', async () => {
    const fixture = await createHost();
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector('h1')?.textContent).toContain('Test Heading');
    expect(root.querySelector('button[authLayoutBack]')).toBeTruthy();
    expect(root.querySelector('[authLayoutFooter]')?.textContent).toContain('Footer content');
  });

  it('always renders the shared brand panel without pages needing to project it', async () => {
    const fixture = await createHost();
    expect(fixture.nativeElement.querySelector('app-auth-brand-panel')).toBeTruthy();
  });

  it('uses a single <main> landmark for the form column', async () => {
    const fixture = await createHost();
    expect(fixture.nativeElement.querySelectorAll('main')).toHaveLength(1);
  });

  it('exposes the responsive class hooks that hide the brand column below the tablet breakpoint', async () => {
    const fixture = await createHost();
    const brandColumn: HTMLElement = fixture.nativeElement.querySelector(
      '.auth-layout__brand-column',
    );
    expect(brandColumn).toBeTruthy();
    expect(brandColumn.querySelector('app-auth-brand-panel')).toBeTruthy();
  });
});
