import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';

import { SideDrawerComponent } from './side-drawer.component';
import { SideDrawerFooterDirective } from './side-drawer-footer.directive';

@Component({
  imports: [SideDrawerComponent, SideDrawerFooterDirective],
  template: `
    <button class="opener" type="button">Open</button>
    <app-side-drawer
      [open]="open()"
      [title]="{ key: 'TEST.TITLE' }"
      [inset]="true"
      (closed)="closed.update((count) => count + 1)"
    >
      <button class="body-action" type="button">Body action</button>
      <div sideDrawerFooter><button class="footer-action" type="button">Apply</button></div>
    </app-side-drawer>
  `,
})
class DrawerHostComponent {
  readonly open = signal(false);
  readonly closed = signal(0);
}

describe('SideDrawerComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SideDrawerComponent, DrawerHostComponent],
      providers: [provideTranslateService({ fallbackLang: 'en', lang: 'en' })],
    });
    TestBed.inject(TranslateService).setTranslation('en', {
      STARLINKS: { DRAWER: { CLOSE: 'Close drawer' } },
      TEST: { TITLE: 'Drawer title' },
    });
  });

  afterEach(() => {
    document.documentElement.dir = 'ltr';
    document.body.style.overflow = '';
  });

  it('is absent while closed and renders a labelled modal dialog, backdrop, body, and footer when open', async () => {
    const fixture = createFixture();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();

    await open(fixture);
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    const title = fixture.nativeElement.querySelector(`#${dialog.getAttribute('aria-labelledby')}`);

    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(title.textContent).toContain('Drawer title');
    expect(fixture.nativeElement.querySelector('.side-drawer__backdrop')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.body-action')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.footer-action')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('iconsax-icon[name="close-circle"]')).toBeTruthy();
    expect(dialog.classList).toContain('side-drawer--inset');
  });

  it('uses opening/open/closing lifecycle hooks and keeps the closing layer mounted until animation completes', async () => {
    const fixture = createFixture();
    await open(fixture);
    expect(layer(fixture).dataset['phase']).toBe('open');

    fixture.componentInstance.open.set(false);
    await fixture.whenStable();
    expect(layer(fixture).dataset['phase']).toBe('closing');
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeTruthy();
    await waitForClose();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('emits one close request from the native close button, backdrop, or Escape without internal click-through', async () => {
    const fixture = createFixture();
    await open(fixture);
    (fixture.nativeElement.querySelector('.body-action') as HTMLButtonElement).click();
    expect(fixture.componentInstance.closed()).toBe(0);

    (fixture.nativeElement.querySelector('.side-drawer__close') as HTMLButtonElement).click();
    (fixture.nativeElement.querySelector('.side-drawer__backdrop') as HTMLElement).click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(fixture.componentInstance.closed()).toBe(1);
  });

  it('moves focus into the drawer, traps boundary Tab, and restores focus after close', async () => {
    const fixture = createFixture();
    const opener = fixture.nativeElement.querySelector('.opener') as HTMLButtonElement;
    opener.focus();
    await open(fixture);
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('.side-drawer__close'));

    const footer = fixture.nativeElement.querySelector('.footer-action') as HTMLButtonElement;
    footer.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('.side-drawer__close'));

    fixture.componentInstance.open.set(false);
    await fixture.whenStable();
    await waitForClose();
    await Promise.resolve();
    expect(document.activeElement).toBe(opener);
  });

  it('locks body scrolling while rendered and restores it after close or destroy', async () => {
    document.body.style.overflow = 'auto';
    const fixture = createFixture();
    await open(fixture);
    expect(document.body.style.overflow).toBe('hidden');

    fixture.componentInstance.open.set(false);
    await fixture.whenStable();
    await waitForClose();
    expect(document.body.style.overflow).toBe('auto');

    await open(fixture);
    fixture.destroy();
    expect(document.body.style.overflow).toBe('auto');
  });

  it('creates stable unique IDs and attaches the drawer to logical inline-end in RTL', async () => {
    document.documentElement.dir = 'rtl';
    const first = createFixture();
    const second = createFixture();
    await open(first);
    await open(second);
    const firstDialog = first.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    const secondDialog = second.nativeElement.querySelector('[role="dialog"]') as HTMLElement;

    expect(firstDialog.id).not.toBe(secondDialog.id);
    expect(firstDialog.classList).toContain('side-drawer');
    expect(firstDialog.classList).toContain('side-drawer--inline-end');
    expect(layer(first).classList).toContain('side-drawer-layer--open');
    expect(firstDialog.getAttribute('dir')).toBeNull();
  });

  it('attaches the drawer to the physical right in LTR', async () => {
    const fixture = createFixture();
    await open(fixture);
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;

    expect(dialog.classList).toContain('side-drawer--inline-end');
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('supports medium width and exposes reduced-motion/mobile styling hooks', async () => {
    const fixture = TestBed.createComponent(SideDrawerComponent);
    fixture.componentRef.setInput('title', { key: 'TEST.TITLE' });
    fixture.componentRef.setInput('width', 'medium');
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.side-drawer--medium')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.side-drawer__body')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.side-drawer__footer')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.side-drawer--inset')).toBeNull();
  });
});

function createFixture(): ComponentFixture<DrawerHostComponent> {
  const fixture = TestBed.createComponent(DrawerHostComponent);
  fixture.detectChanges();
  return fixture;
}

async function open(fixture: ComponentFixture<DrawerHostComponent>): Promise<void> {
  fixture.componentInstance.open.set(true);
  await fixture.whenStable();
  await Promise.resolve();
  fixture.detectChanges();
}

async function waitForClose(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 210));
}

function layer(fixture: ComponentFixture<DrawerHostComponent>): HTMLElement {
  return fixture.nativeElement.querySelector('.side-drawer-layer') as HTMLElement;
}
