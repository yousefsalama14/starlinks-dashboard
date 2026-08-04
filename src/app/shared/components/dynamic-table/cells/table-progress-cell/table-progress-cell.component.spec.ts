import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';

import {
  TableProgressColumn,
  TableProgressDisplay,
  TableProgressTone,
} from '../../dynamic-table.types';
import { TableProgressCellComponent } from './table-progress-cell.component';

interface ProgressRow {
  readonly id: string;
  readonly completion: number;
}

const ROW: ProgressRow = Object.freeze({ id: 'record-1', completion: 35 });

describe('TableProgressCellComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService({ fallbackLang: 'en', lang: 'en' })],
    });
    TestBed.inject(TranslateService).setTranslation('en', {
      TEST: { PROGRESS: 'Completed {{value}} of {{max}}' },
    });
  });

  it('defaults max to 100, tone to neutral, and renders a localized percentage', () => {
    const fixture = createFixture({ value: 35 });
    const progress = fixture.nativeElement.querySelector('[role="progressbar"]') as HTMLElement;

    expect(progress.getAttribute('aria-valuemin')).toBe('0');
    expect(progress.getAttribute('aria-valuenow')).toBe('35');
    expect(progress.getAttribute('aria-valuemax')).toBe('100');
    expect(progress.getAttribute('aria-valuetext')).toBe('35%');
    expect(progress.dataset['tone']).toBe('neutral');
    expect(progress.classList).toContain('table-progress-cell--neutral');
    expect(progress.querySelector('.table-progress-cell__value')?.getAttribute('style')).toContain(
      'inline-size: 35%',
    );
  });

  it.each<TableProgressTone>(['neutral', 'info', 'success', 'warning', 'danger'])(
    'renders the %s tone',
    (tone) => {
      const fixture = createFixture({ value: 1, max: 4, tone });
      const progress = fixture.nativeElement.querySelector('[role="progressbar"]') as HTMLElement;

      expect(progress.dataset['tone']).toBe(tone);
      expect(progress.classList).toContain(`table-progress-cell--${tone}`);
    },
  );

  it('renders translated custom labels with parameters and tooltip text', () => {
    const fixture = createFixture(
      {
        value: 3,
        max: 4,
        tone: 'success',
        label: { key: 'TEST.PROGRESS', params: { value: 3, max: 4 } },
      },
      true,
    );
    const progress = fixture.nativeElement.querySelector('[role="progressbar"]') as HTMLElement;

    expect(progress.textContent?.trim()).toBe('Completed 3 of 4');
    expect(progress.getAttribute('aria-valuetext')).toBe('Completed 3 of 4');
    expect(progress.getAttribute('title')).toBe('Completed 3 of 4');
  });

  it('clamps visual and accessible values to the configured range', () => {
    let fixture = createFixture({ value: -5, max: 20 });
    let progress = fixture.nativeElement.querySelector('[role="progressbar"]') as HTMLElement;

    expect(progress.getAttribute('aria-valuenow')).toBe('0');
    expect(progress.querySelector('.table-progress-cell__value')?.getAttribute('style')).toContain(
      'inline-size: 0%',
    );

    fixture = createFixture({ value: 25, max: 20 });
    progress = fixture.nativeElement.querySelector('[role="progressbar"]') as HTMLElement;
    expect(progress.getAttribute('aria-valuenow')).toBe('20');
    expect(progress.querySelector('.table-progress-cell__value')?.getAttribute('style')).toContain(
      'inline-size: 100%',
    );
  });

  it.each([
    [{ value: Number.NaN }, /Invalid progress value.*NaN/],
    [{ value: Infinity }, /Invalid progress value.*Infinity/],
    [{ value: 1, max: 0 }, /Invalid progress max.*0/],
    [{ value: 1, max: -1 }, /Invalid progress max.*-1/],
    [{ value: 1, max: Infinity }, /Invalid progress max.*Infinity/],
  ] as const)('rejects invalid progress contracts', (display, expectedError) => {
    expect(() => createFixture(display)).toThrowError(expectedError);
  });

  it('reacts to locale changes for generated percentage labels', () => {
    const fixture = createFixture({ value: 25 });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('ar', {});
    translate.use('ar').subscribe();
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('.table-progress-cell__label').textContent,
    ).toContain(
      new Intl.NumberFormat('ar', { style: 'percent', maximumFractionDigits: 0 }).format(0.25),
    );
  });

  it('does not mutate immutable row or display contracts', () => {
    const display = Object.freeze({ value: 35, max: 100, tone: 'info' as const });
    const fixture = createFixture(display);

    expect(fixture.componentInstance.row()).toBe(ROW);
    expect(Object.isFrozen(ROW)).toBe(true);
    expect(Object.isFrozen(display)).toBe(true);
    expect(display).toEqual({ value: 35, max: 100, tone: 'info' });
  });
});

function createFixture(
  display: TableProgressDisplay,
  tooltip = false,
): ComponentFixture<TableProgressCellComponent<ProgressRow>> {
  const column: TableProgressColumn<ProgressRow> = Object.freeze({
    key: 'completion',
    label: { key: 'TEST.PROGRESS' },
    type: 'progress',
    field: 'completion',
    tooltip: tooltip ? 'always' : 'none',
    resolveProgress: () => display,
  });
  const fixture = TestBed.createComponent(TableProgressCellComponent) as ComponentFixture<
    TableProgressCellComponent<ProgressRow>
  >;
  fixture.componentRef.setInput('row', ROW);
  fixture.componentRef.setInput('value', ROW.completion);
  fixture.componentRef.setInput('column', column);
  fixture.detectChanges();
  return fixture;
}
