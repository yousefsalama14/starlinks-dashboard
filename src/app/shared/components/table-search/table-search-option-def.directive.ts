import { Directive, TemplateRef, inject, input } from '@angular/core';

import { TableSearchOptionContext, TableSearchSuggestion } from './table-search.types';

@Directive({
  selector: 'ng-template[appTableSearchOptionDef]',
  standalone: true,
})
export class TableSearchOptionDefDirective<T> {
  /** Type-inference source for strict projected suggestion templates. */
  readonly suggestions = input.required<readonly TableSearchSuggestion<T>[]>({
    alias: 'appTableSearchOptionDefOf',
  });
  readonly template = inject<TemplateRef<TableSearchOptionContext<T>>>(TemplateRef);

  static ngTemplateContextGuard<T>(
    _directive: TableSearchOptionDefDirective<T>,
    _context: unknown,
  ): _context is TableSearchOptionContext<T> {
    return true;
  }
}
