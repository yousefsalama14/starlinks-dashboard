import { Component, TemplateRef, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { TableSearchOptionDefDirective } from './table-search-option-def.directive';
import { TableSearchOptionContext, TableSearchSuggestion } from './table-search.types';

interface TestSuggestion {
  readonly id: number;
  readonly name: string;
}

@Component({
  imports: [TableSearchOptionDefDirective],
  template: `
    <ng-template
      appTableSearchOptionDef
      [appTableSearchOptionDefOf]="suggestions"
      let-item
      let-value="value"
      let-index="index"
      let-active="active"
    >
      {{ item.name }} {{ value.id }} {{ index }} {{ active }}
    </ng-template>
  `,
})
class TestHostComponent {
  readonly suggestions: readonly TableSearchSuggestion<TestSuggestion>[] = [
    { id: 'one', value: { id: 1, name: 'First' } },
  ];
  readonly definition = viewChild.required(TableSearchOptionDefDirective<TestSuggestion>);
}

describe('TableSearchOptionDefDirective', () => {
  it('captures a typed template and inference source', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.definition().template).toBeInstanceOf(TemplateRef);
    expect(fixture.componentInstance.definition().suggestions()).toBe(
      fixture.componentInstance.suggestions,
    );
  });

  it('exposes the complete typed option context', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const suggestion = fixture.componentInstance.suggestions[0];
    const context: TableSearchOptionContext<TestSuggestion> = {
      $implicit: suggestion.value,
      suggestion,
      value: suggestion.value,
      index: 0,
      active: true,
    };

    expect(
      TableSearchOptionDefDirective.ngTemplateContextGuard(
        fixture.componentInstance.definition(),
        context,
      ),
    ).toBe(true);
  });
});
