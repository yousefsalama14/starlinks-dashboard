import { Component, TemplateRef, viewChildren } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { DynamicTableColumn, TableCellContext } from './dynamic-table.types';
import { TableCellDefDirective } from './table-cell-def.directive';

interface TestRow {
  readonly id: number;
  readonly name: string;
}

@Component({
  imports: [TableCellDefDirective],
  template: `
    <ng-template appTableCellDef="name" [appTableCellDefOf]="rows" let-row let-value="value">
      {{ row.name }} {{ value }}
    </ng-template>
    <ng-template appTableCellDef="summary" [appTableCellDefOf]="rows" let-row>
      {{ row.name }}
    </ng-template>
  `,
})
class TestHostComponent {
  readonly rows: readonly TestRow[] = [{ id: 1, name: 'Test row' }];
  readonly definitions = viewChildren(TableCellDefDirective);
}

describe('TableCellDefDirective', () => {
  it('creates without any PrimeNG providers', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.definitions()).toHaveLength(2);
  });

  it('exposes each template key and captured TemplateRef', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    const definitions = fixture.componentInstance.definitions();

    expect(definitions.map((definition) => definition.key())).toEqual(['name', 'summary']);
    expect(definitions.every((definition) => definition.template instanceof TemplateRef)).toBe(
      true,
    );
  });

  it('provides a typed cell context guard', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    const column: DynamicTableColumn<TestRow> = {
      key: 'name',
      label: { key: 'STARLINKS.TABLE.NAME' },
      type: 'text',
      field: 'name',
    };
    const row: TestRow = { id: 1, name: 'Test row' };
    const context: TableCellContext<TestRow, string> = {
      $implicit: row,
      row,
      value: row.name,
      column,
      rowIndex: 0,
      rowId: row.id,
    };
    const definition = fixture.componentInstance.definitions()[0] as TableCellDefDirective<
      TestRow,
      string
    >;

    expect(TableCellDefDirective.ngTemplateContextGuard(definition, context)).toBe(true);
  });
});
