import { Directive, TemplateRef, inject, input } from '@angular/core';

import { TableCellContext } from './dynamic-table.types';

@Directive({
  selector: 'ng-template[appTableCellDef]',
  standalone: true,
})
export class TableCellDefDirective<T, TValue = unknown> {
  readonly key = input.required<string>({ alias: 'appTableCellDef' });
  /** Type-inference source for strict projected-template row contexts. */
  readonly rows = input.required<readonly T[]>({ alias: 'appTableCellDefOf' });
  readonly template = inject<TemplateRef<TableCellContext<T, TValue>>>(TemplateRef);

  static ngTemplateContextGuard<T, TValue>(
    _directive: TableCellDefDirective<T, TValue>,
    _context: unknown,
  ): _context is TableCellContext<T, TValue> {
    return true;
  }
}
