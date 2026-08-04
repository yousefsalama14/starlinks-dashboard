import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';

import { TableLinkColumn } from '../../dynamic-table.types';
import { TableLinkCellComponent } from './table-link-cell.component';

interface LinkRow {
  readonly id: string;
  readonly reference: string | null;
  readonly locked: boolean;
}

const ROW: LinkRow = Object.freeze({ id: 'record-1', reference: 'REF-2026-1', locked: false });

const COLUMN: TableLinkColumn<LinkRow> = Object.freeze({
  key: 'reference',
  label: { key: 'TEST.REFERENCE' },
  type: 'link',
  field: 'reference',
  tooltip: 'always',
  resolveLink: (row: LinkRow, value: unknown) => ({
    commands: ['/records', row.id],
    queryParams: { reference: value },
  }),
  disabled: (row: LinkRow) => row.locked,
  accessibleLabel: (_row: LinkRow, value: unknown) => ({
    key: 'TEST.OPEN_REFERENCE',
    params: { value },
  }),
});

describe('TableLinkCellComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideTranslateService({ fallbackLang: 'en', lang: 'en' })],
    });
    TestBed.inject(TranslateService).setTranslation('en', {
      TEST: { REFERENCE: 'Reference', OPEN_REFERENCE: 'Open {{value}}' },
    });
  });

  it('renders an accessible router link with query parameters and tooltip', () => {
    const fixture = createFixture();
    const anchor = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;

    expect(anchor.textContent?.trim()).toBe('REF-2026-1');
    expect(anchor.getAttribute('href')).toBe('/records/record-1?reference=REF-2026-1');
    expect(anchor.getAttribute('aria-label')).toBe('Open REF-2026-1');
    expect(anchor.getAttribute('title')).toBe('REF-2026-1');
  });

  it('uses the visible link text as the accessible name when no label is configured', () => {
    const fixture = createFixture({ ...COLUMN, accessibleLabel: undefined });
    const anchor = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;

    expect(anchor.getAttribute('aria-label')).toBeNull();
    expect(anchor.textContent?.trim()).toBe('REF-2026-1');
  });

  it('renders a non-interactive disabled link representation for column-disabled rows', () => {
    const fixture = createFixture(COLUMN, { ...ROW, locked: true });
    const disabled = fixture.nativeElement.querySelector('[role="link"]') as HTMLElement;

    expect(fixture.nativeElement.querySelector('a')).toBeNull();
    expect(disabled.getAttribute('aria-disabled')).toBe('true');
    expect(disabled.textContent?.trim()).toBe('REF-2026-1');
  });

  it('does not resolve a link target when the table disables interaction', () => {
    let resolveCount = 0;
    const resolveLink = (row: LinkRow, value: unknown) => {
      resolveCount += 1;
      return COLUMN.resolveLink(row, value);
    };
    const fixture = createFixture({ ...COLUMN, resolveLink }, ROW, true);

    expect(fixture.nativeElement.querySelector('a')).toBeNull();
    expect(resolveCount).toBe(0);
  });

  it('renders nothing and does not resolve a target for missing values', () => {
    let resolveCount = 0;
    const resolveLink = (row: LinkRow, value: unknown) => {
      resolveCount += 1;
      return COLUMN.resolveLink(row, value);
    };
    const fixture = createFixture({ ...COLUMN, resolveLink }, { ...ROW, reference: null });

    expect(fixture.nativeElement.textContent?.trim()).toBe('');
    expect(resolveCount).toBe(0);
  });

  it('does not mutate immutable row or column inputs', () => {
    const fixture = createFixture();

    expect(fixture.componentInstance.row()).toBe(ROW);
    expect(fixture.componentInstance.column()).toBe(COLUMN);
    expect(Object.isFrozen(ROW)).toBe(true);
    expect(Object.isFrozen(COLUMN)).toBe(true);
  });
});

function createFixture(
  column: TableLinkColumn<LinkRow> = COLUMN,
  row: LinkRow = ROW,
  disabled = false,
): ComponentFixture<TableLinkCellComponent<LinkRow>> {
  const fixture = TestBed.createComponent(TableLinkCellComponent) as ComponentFixture<
    TableLinkCellComponent<LinkRow>
  >;
  fixture.componentRef.setInput('row', row);
  fixture.componentRef.setInput('value', row.reference);
  fixture.componentRef.setInput('column', column);
  fixture.componentRef.setInput('disabled', disabled);
  fixture.detectChanges();
  return fixture;
}
