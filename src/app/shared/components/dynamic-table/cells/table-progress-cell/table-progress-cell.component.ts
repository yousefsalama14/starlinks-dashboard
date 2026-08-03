import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import {
  TableProgressColumn,
  TableProgressDisplay,
  TableProgressTone,
  TranslatedText,
} from '../../dynamic-table.types';
import { formatTableNumber } from '../../formatters/table-number-format';

interface ResolvedProgressDisplay {
  readonly value: number;
  readonly max: number;
  readonly percentage: number;
  readonly tone: TableProgressTone;
  readonly label: TranslatedText | null;
}

@Component({
  selector: 'app-table-progress-cell',
  imports: [TranslatePipe],
  templateUrl: './table-progress-cell.component.html',
  styleUrl: './table-progress-cell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableProgressCellComponent<T> {
  private readonly translate = inject(TranslateService);

  readonly row = input.required<T>();
  readonly value = input.required<unknown>();
  readonly column = input.required<TableProgressColumn<T>>();
  readonly resolvedDisplay = input<TableProgressDisplay | null>(null);

  protected readonly display = computed<ResolvedProgressDisplay>(() =>
    this.resolveDisplay(
      this.resolvedDisplay() ?? this.column().resolveProgress(this.row(), this.value()),
    ),
  );

  protected readonly defaultLabel = computed(() =>
    formatTableNumber(this.display().percentage / 100, this.translate.currentLang() ?? 'en', {
      style: 'percent',
      maximumFractionDigits: 0,
    }),
  );

  private resolveDisplay(display: TableProgressDisplay): ResolvedProgressDisplay {
    const columnKey = this.column().key;
    if (!Number.isFinite(display.value)) {
      throw new Error(
        `[DynamicTable] Invalid progress value for column "${columnKey}": ${String(display.value)}. Expected a finite number.`,
      );
    }

    const max = display.max ?? 100;
    if (!Number.isFinite(max) || max <= 0) {
      throw new Error(
        `[DynamicTable] Invalid progress max for column "${columnKey}": ${String(max)}. Expected a finite number greater than zero.`,
      );
    }

    const value = Math.min(Math.max(display.value, 0), max);
    return {
      value,
      max,
      percentage: (value / max) * 100,
      tone: display.tone ?? 'neutral',
      label: display.label ?? null,
    };
  }
}
