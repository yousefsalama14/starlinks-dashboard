import { Component, TemplateRef, viewChildren } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { DynamicTableColumn, TableHeaderContext } from './dynamic-table.types';
import { TableHeaderDefDirective } from './table-header-def.directive';

interface TestRow {
  readonly id: number;
  readonly name: string;
}

@Component({
  imports: [TableHeaderDefDirective],
  template: `
    <ng-template appTableHeaderDef="name" [appTableHeaderDefOf]="columns" let-column>
      {{ column.key }}
    </ng-template>
    <ng-template appTableHeaderDef="actions" [appTableHeaderDefOf]="columns" let-column>
      {{ column.key }}
    </ng-template>
  `,
})
class TestHostComponent {
  readonly columns: readonly DynamicTableColumn<TestRow>[] = [
    {
      key: 'name',
      label: { key: 'STARLINKS.TABLE.NAME' },
      type: 'text',
      field: 'name',
    },
  ];
  readonly definitions = viewChildren(TableHeaderDefDirective);
}

describe('TableHeaderDefDirective', () => {
  it('creates without any PrimeNG providers', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.definitions()).toHaveLength(2);
  });

  it('exposes each template key and captured TemplateRef', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    const definitions = fixture.componentInstance.definitions();

    expect(definitions.map((definition) => definition.key())).toEqual(['name', 'actions']);
    expect(definitions.every((definition) => definition.template instanceof TemplateRef)).toBe(
      true,
    );
  });

  it('provides a typed header context guard', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    const column: DynamicTableColumn<TestRow> = {
      key: 'name',
      label: { key: 'STARLINKS.TABLE.NAME' },
      type: 'text',
      field: 'name',
    };
    const context: TableHeaderContext<TestRow> = {
      $implicit: column,
      column,
    };
    const definition =
      fixture.componentInstance.definitions()[0] as TableHeaderDefDirective<TestRow>;

    expect(TableHeaderDefDirective.ngTemplateContextGuard(definition, context)).toBe(true);
  });
});
