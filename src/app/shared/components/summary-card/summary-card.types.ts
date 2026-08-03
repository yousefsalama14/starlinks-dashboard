import { TranslatedText } from '../dynamic-table/dynamic-table.types';

export type SummaryCardTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

export type SummaryCardTrendDirection = 'up' | 'down';

export interface SummaryCardTrend {
  readonly direction: SummaryCardTrendDirection;
  readonly accessibleLabel: TranslatedText;
}
