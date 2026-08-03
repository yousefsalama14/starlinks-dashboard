import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  computed,
  input,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { TranslatedText } from '../dynamic-table/dynamic-table.types';
import { SummaryCardTone, SummaryCardTrend } from './summary-card.types';

const SUMMARY_CARD_TONES = new Set<SummaryCardTone>([
  'neutral',
  'primary',
  'success',
  'warning',
  'danger',
  'info',
]);
let nextSummaryCardId = 0;

@Component({
  selector: 'app-summary-card',
  imports: [TranslatePipe],
  templateUrl: './summary-card.component.html',
  styleUrl: './summary-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SummaryCardComponent {
  readonly label = input.required<TranslatedText>();
  readonly value = input.required<string | number>();
  readonly icon = input<string | null>(null);
  readonly tone = input<SummaryCardTone>('neutral');
  readonly trend = input<SummaryCardTrend | null>(null);

  protected readonly resolvedTone = computed(() => validateTone(this.tone()));
  protected readonly resolvedValue = computed(() => validateValue(this.value()));
  protected readonly resolvedIcon = computed(() => validateIcon(this.icon()));
  protected readonly resolvedTrend = computed(() => validateTrend(this.trend()));
  protected readonly labelId = `summary-card-${++nextSummaryCardId}-label`;
  protected readonly valueId = `${this.labelId}-value`;
  protected readonly trendId = `${this.labelId}-trend`;
}

function validateTone(value: SummaryCardTone): SummaryCardTone {
  if (!SUMMARY_CARD_TONES.has(value)) {
    throw new Error(`[SummaryCard] Unsupported tone "${String(value)}".`);
  }
  return value;
}

function validateValue(value: string | number): string | number {
  if (typeof value === 'number' && !Number.isFinite(value)) {
    throw new Error(`[SummaryCard] Numeric value must be finite: ${String(value)}.`);
  }
  if (typeof value === 'string' && value.trim().length === 0) {
    throw new Error('[SummaryCard] String value must not be empty or whitespace-only.');
  }
  return value;
}

function validateIcon(value: string | null): string | null {
  if (value !== null && value.trim().length === 0) {
    throw new Error('[SummaryCard] icon must be null or a non-empty Iconsax name.');
  }
  return value;
}

function validateTrend(value: SummaryCardTrend | null): SummaryCardTrend | null {
  if (value !== null && value.direction !== 'up' && value.direction !== 'down') {
    throw new Error(`[SummaryCard] Unsupported trend direction "${String(value.direction)}".`);
  }
  return value;
}
