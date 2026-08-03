import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';

import { TableStatusColumn, TableStatusTone } from '../../dynamic-table.types';
import { TableStatusCellComponent } from './table-status-cell.component';

interface StatusRow {
  readonly id: string;
  readonly state: string;
}

const ROW: StatusRow = Object.freeze({ id: 'record-1', state: 'ready' });

describe('TableStatusCellComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService({ fallbackLang: 'en', lang: 'en' })],
    });
    TestBed.inject(TranslateService).setTranslation('en', {
      TEST: { STATUS: '{{state}} status' },
    });
  });

  it.each<TableStatusTone>(['neutral', 'info', 'success', 'warning', 'danger', 'accent'])(
    'renders the translated %s tone without live-region semantics',
    (tone) => {
      const fixture = createFixture(tone);
      const badge = fixture.nativeElement.querySelector('.table-status-cell') as HTMLElement;

      expect(badge.textContent?.trim()).toBe('ready status');
      expect(badge.dataset['tone']).toBe(tone);
      expect(badge.classList).toContain(`table-status-cell--${tone}`);
      expect(badge.getAttribute('role')).toBeNull();
    },
  );

  it('passes the immutable row and raw value to the resolver', () => {
    let resolvedRow: StatusRow | undefined;
    let resolvedValue: unknown;
    const column = createColumn('success', (row, value) => {
      resolvedRow = row;
      resolvedValue = value;
    });
    const fixture = createFixture('success', column);

    expect(resolvedRow).toBe(ROW);
    expect(resolvedValue).toBe('ready');
    expect(fixture.componentInstance.row()).toBe(ROW);
    expect(fixture.componentInstance.column()).toBe(column);
    expect(Object.isFrozen(ROW)).toBe(true);
    expect(Object.isFrozen(column)).toBe(true);
  });

  it('uses the translated label for always-on tooltips', () => {
    const fixture = createFixture('info', { ...createColumn('info'), tooltip: 'always' });

    expect(fixture.nativeElement.querySelector('.table-status-cell').getAttribute('title')).toBe(
      'ready status',
    );
  });
});

function createColumn(
  tone: TableStatusTone,
  onResolve?: (row: StatusRow, value: unknown) => void,
): TableStatusColumn<StatusRow> {
  return Object.freeze({
    key: 'state',
    label: { key: 'TEST.STATUS' },
    type: 'status' as const,
    field: 'state' as const,
    resolveStatus: (row: StatusRow, value: unknown) => {
      onResolve?.(row, value);
      return { label: { key: 'TEST.STATUS', params: { state: value } }, tone };
    },
  });
}

function createFixture(
  tone: TableStatusTone,
  column: TableStatusColumn<StatusRow> = createColumn(tone),
): ComponentFixture<TableStatusCellComponent<StatusRow>> {
  const fixture = TestBed.createComponent(TableStatusCellComponent) as ComponentFixture<
    TableStatusCellComponent<StatusRow>
  >;
  fixture.componentRef.setInput('row', ROW);
  fixture.componentRef.setInput('value', ROW.state);
  fixture.componentRef.setInput('column', column);
  fixture.detectChanges();
  return fixture;
}
