import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  ElementRef,
  HostListener,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { TranslatedText } from '../dynamic-table/dynamic-table.types';

export type SideDrawerWidth = 'narrow' | 'medium';
type SideDrawerPhase = 'closed' | 'opening' | 'open' | 'closing';

const CLOSE_DURATION_MS = 200;
const bodyLocks = new WeakMap<Document, { count: number; overflow: string }>();
let nextSideDrawerId = 0;

@Component({
  selector: 'app-side-drawer',
  imports: [TranslatePipe],
  templateUrl: './side-drawer.component.html',
  styleUrl: './side-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SideDrawerComponent {
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly dialog = viewChild<ElementRef<HTMLElement>>('dialog');
  private readonly generatedId = `side-drawer-${++nextSideDrawerId}`;
  private restoreFocusTarget: HTMLElement | null = null;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  private scrollLocked = false;
  private closeRequested = false;

  readonly open = input(false);
  readonly title = input.required<TranslatedText>();
  readonly closeOnBackdrop = input(true);
  readonly closeOnEscape = input(true);
  readonly width = input<SideDrawerWidth>('narrow');
  readonly drawerId = input<string | null>(null);

  readonly closed = output<void>();

  protected readonly rendered = signal(false);
  protected readonly phase = signal<SideDrawerPhase>('closed');
  readonly resolvedDrawerId = computed(() => this.drawerId() ?? this.generatedId);
  protected readonly titleId = computed(() => `${this.resolvedDrawerId()}-title`);

  constructor() {
    effect(() => {
      if (this.open()) {
        this.beginOpening();
      } else {
        this.beginClosing();
      }
    });

    this.destroyRef.onDestroy(() => this.cleanup());
  }

  @HostListener('document:keydown', ['$event'])
  protected handleDocumentKeydown(event: KeyboardEvent): void {
    if (!this.rendered() || this.phase() === 'closing') {
      return;
    }
    if (event.key === 'Escape' && this.closeOnEscape()) {
      event.preventDefault();
      this.requestClose();
      return;
    }
    if (event.key === 'Tab') {
      this.keepFocusInside(event);
    }
  }

  protected requestBackdropClose(): void {
    if (this.closeOnBackdrop()) {
      this.requestClose();
    }
  }

  protected requestClose(): void {
    if (this.closeRequested || !this.open()) {
      return;
    }
    this.closeRequested = true;
    this.closed.emit();
  }

  private beginOpening(): void {
    this.clearCloseTimer();
    this.closeRequested = false;
    if (!this.rendered()) {
      this.restoreFocusTarget =
        this.document.activeElement instanceof HTMLElement ? this.document.activeElement : null;
      this.rendered.set(true);
      this.lockBodyScroll();
    }
    this.phase.set('opening');
    queueMicrotask(() => {
      if (!this.open() || !this.rendered()) {
        return;
      }
      this.phase.set('open');
      queueMicrotask(() => this.focusInitialControl());
    });
  }

  private beginClosing(): void {
    if (!this.rendered()) {
      this.phase.set('closed');
      this.closeRequested = false;
      return;
    }
    if (this.phase() === 'closing') {
      return;
    }
    this.phase.set('closing');
    this.closeTimer = setTimeout(() => {
      this.closeTimer = null;
      if (this.open()) {
        return;
      }
      this.rendered.set(false);
      this.phase.set('closed');
      this.closeRequested = false;
      this.unlockBodyScroll();
      this.restoreFocus();
    }, CLOSE_DURATION_MS);
  }

  private focusInitialControl(): void {
    const dialog = this.dialog()?.nativeElement;
    if (!dialog || !this.open()) {
      return;
    }
    const initial = dialog.querySelector<HTMLElement>('[data-side-drawer-initial-focus]');
    (initial ?? dialog).focus();
  }

  private keepFocusInside(event: KeyboardEvent): void {
    const dialog = this.dialog()?.nativeElement;
    if (!dialog) {
      return;
    }
    const controls = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((control) => control.getAttribute('aria-hidden') !== 'true');
    if (controls.length === 0) {
      event.preventDefault();
      dialog.focus();
      return;
    }
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && this.document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && this.document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private lockBodyScroll(): void {
    if (this.scrollLocked) {
      return;
    }
    const current = bodyLocks.get(this.document);
    if (current) {
      current.count += 1;
    } else {
      bodyLocks.set(this.document, {
        count: 1,
        overflow: this.document.body.style.overflow,
      });
      this.document.body.style.overflow = 'hidden';
    }
    this.scrollLocked = true;
  }

  private unlockBodyScroll(): void {
    if (!this.scrollLocked) {
      return;
    }
    const current = bodyLocks.get(this.document);
    if (current && current.count > 1) {
      current.count -= 1;
    } else if (current) {
      this.document.body.style.overflow = current.overflow;
      bodyLocks.delete(this.document);
    }
    this.scrollLocked = false;
  }

  private restoreFocus(): void {
    const target = this.restoreFocusTarget;
    this.restoreFocusTarget = null;
    if (target?.isConnected) {
      queueMicrotask(() => target.focus());
    }
  }

  private clearCloseTimer(): void {
    if (this.closeTimer !== null) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }

  private cleanup(): void {
    this.clearCloseTimer();
    this.unlockBodyScroll();
    this.restoreFocusTarget = null;
    this.host.nativeElement.removeAttribute('data-side-drawer-open');
  }
}
