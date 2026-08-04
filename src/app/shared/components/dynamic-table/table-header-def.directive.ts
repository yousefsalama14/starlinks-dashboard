import { Directive, TemplateRef, inject, input } from '@angular/core';

import { DynamicTableColumn, TableHeaderContext } from './dynamic-table.types';

@Directive({
  selector: 'ng-template[appTableHeaderDef]',
  standalone: true,
})
export class TableHeaderDefDirective<T> {
  readonly key = input.required<string>({ alias: 'appTableHeaderDef' });
  /** Type-inference source for strict projected-template column contexts. */
  readonly columns = input.required<readonly DynamicTableColumn<T>[]>({
    alias: 'appTableHeaderDefOf',
  });
  readonly template = inject<TemplateRef<TableHeaderContext<T>>>(TemplateRef);

  static ngTemplateContextGuard<T>(
    _directive: TableHeaderDefDirective<T>,
    _context: unknown,
  ): _context is TableHeaderContext<T> {
    return true;
  }
}
