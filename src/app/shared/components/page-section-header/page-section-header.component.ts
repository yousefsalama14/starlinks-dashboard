import { ChangeDetectionStrategy, Component, computed, contentChild, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { TranslatedText } from '../dynamic-table/dynamic-table.types';
import {
  PageSectionHeaderActionsDirective,
  PageSectionHeaderLeadingDirective,
  PageSectionHeaderSupportingDirective,
} from './page-section-header-slot.directive';
import { PageSectionHeaderHeadingLevel } from './page-section-header.types';

let nextPageSectionHeaderId = 0;

@Component({
  selector: 'app-page-section-header',
  imports: [TranslatePipe],
  templateUrl: './page-section-header.component.html',
  styleUrl: './page-section-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageSectionHeaderComponent {
  readonly title = input.required<TranslatedText>();
  readonly subtitle = input<TranslatedText | null>(null);
  readonly headingLevel = input<PageSectionHeaderHeadingLevel>(1);
  readonly compact = input(false);

  protected readonly leadingContent = contentChild(PageSectionHeaderLeadingDirective);
  protected readonly actionContent = contentChild(PageSectionHeaderActionsDirective);
  protected readonly supportingContent = contentChild(PageSectionHeaderSupportingDirective);
  protected readonly resolvedHeadingLevel = computed(() =>
    validateHeadingLevel(this.headingLevel()),
  );
  protected readonly headingId = `page-section-header-${++nextPageSectionHeaderId}-heading`;
}

function validateHeadingLevel(value: PageSectionHeaderHeadingLevel): PageSectionHeaderHeadingLevel {
  if (value !== 1 && value !== 2 && value !== 3) {
    throw new Error(
      `[PageSectionHeader] Invalid headingLevel "${String(value)}". Expected 1, 2, or 3.`,
    );
  }
  return value;
}
