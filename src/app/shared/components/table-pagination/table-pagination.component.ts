import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  computed,
  input,
  output,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { TablePageChange, TablePaginationState } from '../dynamic-table/dynamic-table.types';
import { buildPaginationRange } from './pagination-range';

export interface TablePaginationLabelKeys {
  readonly previous: string;
  readonly next: string;
  readonly navigation: string;
  readonly page: string;
  readonly currentPage: string;
}

const DEFAULT_LABEL_KEYS: TablePaginationLabelKeys = {
  previous: 'STARLINKS.TABLE.PAGINATION.PREVIOUS',
  next: 'STARLINKS.TABLE.PAGINATION.NEXT',
  navigation: 'STARLINKS.TABLE.PAGINATION.NAVIGATION',
  page: 'STARLINKS.TABLE.PAGINATION.PAGE',
  currentPage: 'STARLINKS.TABLE.PAGINATION.CURRENT_PAGE',
};

@Component({
  selector: 'app-table-pagination',
  imports: [TranslatePipe],
  templateUrl: './table-pagination.component.html',
  styleUrl: './table-pagination.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TablePaginationComponent {
  readonly pagination = input.required<TablePaginationState>();
  readonly labelKeys = input<TablePaginationLabelKeys>(DEFAULT_LABEL_KEYS);
  readonly disabled = input(false);
  readonly compact = input(false);
  readonly siblingCount = input(1);
  readonly boundaryCount = input(3);

  readonly pageChange = output<TablePageChange>();

  protected readonly totalPages = computed(() => {
    const { pageSize, totalItems } = this.pagination();
    if (!Number.isFinite(pageSize) || !Number.isFinite(totalItems)) {
      return 0;
    }

    if (pageSize <= 0 || totalItems <= 0) {
      return 0;
    }

    return Math.ceil(totalItems / pageSize);
  });

  protected readonly range = computed(() =>
    buildPaginationRange(
      this.totalPages(),
      this.pagination().page,
      this.siblingCount(),
      this.boundaryCount(),
    ),
  );

  protected readonly canGoPrevious = computed(() => {
    const currentPage = this.pagination().page;
    return (
      !this.disabled() &&
      currentPage > 1 &&
      currentPage <= this.totalPages() &&
      this.totalPages() > 0
    );
  });

  protected readonly canGoNext = computed(() => {
    const currentPage = this.pagination().page;
    return (
      !this.disabled() &&
      currentPage >= 1 &&
      currentPage < this.totalPages() &&
      this.totalPages() > 0
    );
  });

  protected requestPage(page: number): void {
    const { page: currentPage, pageSize } = this.pagination();

    if (
      this.disabled() ||
      this.totalPages() === 0 ||
      page === currentPage ||
      page < 1 ||
      page > this.totalPages()
    ) {
      return;
    }

    this.pageChange.emit({ page, pageSize });
  }
}
