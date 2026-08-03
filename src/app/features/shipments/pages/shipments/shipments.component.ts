import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { DynamicTableComponent } from '../../../../shared/components/dynamic-table/dynamic-table.component';
import {
  DynamicTableColumn,
  TableActionEvent,
  TableDataState,
  TablePageChange,
  TableProgressTone,
  TableSort,
  TableStatusTone,
  TableStatusColumn,
  TableStatusDisplay,
  TranslatedText,
} from '../../../../shared/components/dynamic-table/dynamic-table.types';
import { TableCellDefDirective } from '../../../../shared/components/dynamic-table/table-cell-def.directive';
import { TableStatusCellComponent } from '../../../../shared/components/dynamic-table/cells/table-status-cell/table-status-cell.component';
import { TableSearchComponent } from '../../../../shared/components/table-search/table-search.component';
import { TableSearchOptionDefDirective } from '../../../../shared/components/table-search/table-search-option-def.directive';
import {
  TableRecentSearch,
  TableSearchField,
  TableSearchSuggestion,
  TableSearchSuggestionsState,
} from '../../../../shared/components/table-search/table-search.types';
import { TableToolbarComponent } from '../../../../shared/components/table-toolbar/table-toolbar.component';
import {
  TableFilterField,
  TableFilterModel,
  TableViewOption,
  TableViewOptionChange,
  TableViewOptionOrderChange,
} from '../../../../shared/components/table-toolbar/table-toolbar.types';
import { TableViewOptionsComponent } from '../../../../shared/components/table-toolbar/table-view-options.component';
import { SummaryCardComponent } from '../../../../shared/components/summary-card/summary-card.component';
import {
  SummaryCardTone,
  SummaryCardTrend,
} from '../../../../shared/components/summary-card/summary-card.types';
import { SHIPMENTS_MOCK } from '../../data/shipments.mock';
import {
  Shipment,
  ShipmentActionId,
  ShipmentLocation,
  ShipmentService,
  ShipmentStatus,
} from '../../models/shipment.model';

const DEFAULT_PAGE_SIZE = 9;
const MINIMUM_SEARCH_LENGTH = 2;

type ShipmentSearchFieldKey =
  'shipmentNumber' | 'customerReference' | 'service' | 'origin' | 'destination';

const SEARCH_FIELD_KEYS: readonly ShipmentSearchFieldKey[] = [
  'shipmentNumber',
  'customerReference',
  'service',
  'origin',
  'destination',
];

const SHIPMENT_SEARCH_FIELDS: readonly TableSearchField[] = Object.freeze([
  Object.freeze({
    key: 'shipmentNumber',
    label: { key: 'STARLINKS.SHIPMENTS.COLUMNS.SHIPMENT_NUMBER' },
  }),
  Object.freeze({
    key: 'customerReference',
    label: { key: 'STARLINKS.SHIPMENTS.COLUMNS.CUSTOMER_REFERENCE' },
  }),
  Object.freeze({ key: 'service', label: { key: 'STARLINKS.SHIPMENTS.COLUMNS.SERVICE' } }),
  Object.freeze({ key: 'origin', label: { key: 'STARLINKS.SHIPMENTS.SEARCH.FIELDS.ORIGIN' } }),
  Object.freeze({
    key: 'destination',
    label: { key: 'STARLINKS.SHIPMENTS.SEARCH.FIELDS.DESTINATION' },
  }),
]);

const INITIAL_RECENT_SEARCHES: readonly TableRecentSearch[] = Object.freeze([
  Object.freeze({
    id: 'recent-shipment-number',
    fieldKey: 'shipmentNumber',
    value: 'SLK-2025-5678',
  }),
  Object.freeze({
    id: 'recent-customer-reference',
    fieldKey: 'customerReference',
    value: 'AB-5678-C',
  }),
  Object.freeze({
    id: 'recent-service',
    fieldKey: 'service',
    value: 'last-mile',
    displayValue: { key: 'STARLINKS.SHIPMENTS.SERVICES.LAST_MILE' },
  }),
  Object.freeze({
    id: 'recent-origin',
    fieldKey: 'origin',
    value: 'khobar',
    displayValue: { key: 'STARLINKS.SHIPMENTS.LOCATIONS.KHOBAR' },
  }),
]);

const COLUMN_KEYS = Object.freeze([
  'shipmentNumber',
  'customerReference',
  'service',
  'route',
  'pickupDate',
  'expectedDeliveryDate',
  'progress',
  'status',
  'actions',
] as const);

const CONFIGURABLE_COLUMN_KEYS = Object.freeze(
  COLUMN_KEYS.filter((key) => key !== 'actions'),
) as readonly Exclude<(typeof COLUMN_KEYS)[number], 'actions'>[];

// Stable mock "today": the latest Pickup Date in the immutable fixture data.
const MOCK_PERIOD_REFERENCE_DATE = '2026-12-24';
const PERIOD_DAYS = Object.freeze({
  'last-7-days': 7,
  'last-30-days': 30,
  'last-90-days': 90,
} as const);

const SHIPMENT_FILTER_FIELDS: readonly TableFilterField[] = Object.freeze([
  Object.freeze({
    key: 'status',
    kind: 'multiple-select',
    presentation: 'chips',
    label: { key: 'STARLINKS.SHIPMENTS.COLUMNS.STATUS' },
    options: Object.freeze([
      statusFilterOption('picked-up', 'warning'),
      statusFilterOption('delivered', 'success'),
      statusFilterOption('in-transit', 'info'),
      statusFilterOption('exception', 'danger'),
      statusFilterOption('out-for-delivery', 'accent'),
    ]),
  }),
  Object.freeze({
    key: 'service',
    kind: 'single-select',
    presentation: 'segments',
    label: { key: 'STARLINKS.TABLE.FILTERS.SERVICES' },
    clearOption: Object.freeze({
      value: '__all__',
      label: { key: 'STARLINKS.TABLE.FILTERS.ALL' },
    }),
    options: Object.freeze([
      Object.freeze({
        value: 'freight-forward',
        label: { key: 'STARLINKS.SHIPMENTS.SERVICES.FREIGHT_FORWARD' },
      }),
      Object.freeze({
        value: 'last-mile',
        label: { key: 'STARLINKS.SHIPMENTS.SERVICES.LAST_MILE' },
      }),
      Object.freeze({ value: '3pl', label: { key: 'STARLINKS.SHIPMENTS.SERVICES.3PL' } }),
    ]),
  }),
  Object.freeze({
    key: 'period',
    kind: 'single-select',
    presentation: 'segments',
    label: { key: 'STARLINKS.TABLE.FILTERS.PERIOD' },
    options: Object.freeze([
      Object.freeze({
        value: 'last-7-days',
        label: { key: 'STARLINKS.TABLE.FILTERS.LAST_7_DAYS' },
      }),
      Object.freeze({
        value: 'last-30-days',
        label: { key: 'STARLINKS.TABLE.FILTERS.LAST_30_DAYS' },
      }),
      Object.freeze({
        value: 'last-90-days',
        label: { key: 'STARLINKS.TABLE.FILTERS.LAST_90_DAYS' },
      }),
    ]),
  }),
  Object.freeze({
    key: 'shipmentNumber',
    kind: 'text',
    label: { key: 'STARLINKS.SHIPMENTS.COLUMNS.SHIPMENT_NUMBER' },
  }),
  Object.freeze({
    key: 'customerReference',
    kind: 'text',
    label: { key: 'STARLINKS.SHIPMENTS.COLUMNS.CUSTOMER_REFERENCE' },
  }),
  Object.freeze({
    key: 'origin',
    kind: 'single-select',
    label: { key: 'STARLINKS.SHIPMENTS.FILTERS.ORIGIN' },
    options: locationFilterOptions(),
  }),
  Object.freeze({
    key: 'destination',
    kind: 'single-select',
    label: { key: 'STARLINKS.SHIPMENTS.FILTERS.DESTINATION' },
    options: locationFilterOptions(),
  }),
  Object.freeze({
    key: 'pickupDate',
    kind: 'date',
    label: { key: 'STARLINKS.SHIPMENTS.COLUMNS.PICKUP_DATE' },
  }),
  Object.freeze({
    key: 'expectedDeliveryDate',
    kind: 'date',
    label: { key: 'STARLINKS.SHIPMENTS.COLUMNS.EXPECTED_DELIVERY_DATE' },
  }),
]);

const EMPTY_SHIPMENT_FILTERS: TableFilterModel = Object.freeze({
  shipmentNumber: null,
  customerReference: null,
  service: null,
  origin: null,
  destination: null,
  status: Object.freeze([]),
  period: null,
  pickupDate: null,
  expectedDeliveryDate: null,
});

interface ShipmentSummaryCard {
  readonly key: string;
  readonly label: TranslatedText;
  readonly value: string | number;
  readonly icon: string;
  readonly tone: SummaryCardTone;
  readonly trend?: SummaryCardTrend;
}

// The supplied design represents a portfolio summary, independent of the paged mock table rows.
const SHIPMENT_SUMMARY_CARDS: readonly ShipmentSummaryCard[] = Object.freeze([
  summaryCard('in-transit', 'IN_TRANSIT', 415, 'truck', 'info'),
  summaryCard('out-for-delivery', 'OUT_FOR_DELIVERY', 415, 'truck-time', 'primary'),
  summaryCard('exception', 'EXCEPTION', 14, 'danger', 'danger'),
  summaryCard('on-time-rate', 'ON_TIME_RATE', '97%', 'timer', 'success', {
    direction: 'up',
    accessibleLabel: { key: 'STARLINKS.SHIPMENTS.SUMMARY.ON_TIME_TREND' },
  }),
  summaryCard('fully-delivered', 'FULLY_DELIVERED', 415, 'box-tick', 'success'),
  summaryCard('total-shipments', 'TOTAL_SHIPMENTS', '14,213', 'box', 'neutral'),
]);

const SHIPMENT_VIEW_OPTION_FILTER_FIELDS: readonly TableFilterField[] = Object.freeze(
  SHIPMENT_FILTER_FIELDS.slice(0, 3),
);

const STATUS_TONES: Readonly<Record<ShipmentStatus, TableStatusTone>> = {
  'picked-up': 'warning',
  delivered: 'success',
  'in-transit': 'info',
  exception: 'danger',
  'out-for-delivery': 'accent',
};

const PROGRESS_TONES: Readonly<Record<ShipmentStatus, TableProgressTone>> = {
  'picked-up': 'warning',
  delivered: 'success',
  'in-transit': 'info',
  exception: 'danger',
  'out-for-delivery': 'success',
};

@Component({
  selector: 'app-shipments',
  imports: [
    DecimalPipe,
    DynamicTableComponent,
    RouterLink,
    SummaryCardComponent,
    TableCellDefDirective,
    TableSearchComponent,
    TableSearchOptionDefDirective,
    TableStatusCellComponent,
    TableToolbarComponent,
    TableViewOptionsComponent,
    TranslatePipe,
  ],
  templateUrl: './shipments.component.html',
  styleUrl: './shipments.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ShipmentsComponent {
  private readonly translate = inject(TranslateService);

  protected readonly page = signal(1);
  protected readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  protected readonly sort = signal<TableSort | null>(null);
  protected readonly tableState = signal<TableDataState>({ kind: 'ready' });
  protected readonly lastAction = signal<TableActionEvent<Shipment> | null>(null);
  protected readonly selectedSearchField = signal<ShipmentSearchFieldKey | null>(null);
  protected readonly searchQuery = signal('');
  protected readonly recentSearches = signal<readonly TableRecentSearch[]>(INITIAL_RECENT_SEARCHES);
  protected readonly searchSuggestions = signal<readonly TableSearchSuggestion<Shipment>[]>([]);
  protected readonly searchSuggestionsState = signal<TableSearchSuggestionsState>({ kind: 'idle' });
  protected readonly visibleColumnKeys = signal<readonly string[]>(COLUMN_KEYS);
  protected readonly columnOrder = signal<readonly string[]>(CONFIGURABLE_COLUMN_KEYS);
  protected readonly activeDrawer = signal<'view-options' | null>(null);
  protected readonly filterDraft = signal<TableFilterModel>(EMPTY_SHIPMENT_FILTERS);
  protected readonly appliedFilters = signal<TableFilterModel>(EMPTY_SHIPMENT_FILTERS);
  protected readonly searchFields = SHIPMENT_SEARCH_FIELDS;
  protected readonly minimumSearchLength = MINIMUM_SEARCH_LENGTH;
  protected readonly summaryCards = SHIPMENT_SUMMARY_CARDS;
  protected readonly filterFields = SHIPMENT_FILTER_FIELDS;
  protected readonly viewOptionFilterFields = SHIPMENT_VIEW_OPTION_FILTER_FIELDS;
  protected readonly viewOptions = computed<readonly TableViewOption[]>(() => {
    const visibleKeys = new Set(this.visibleColumnKeys());
    return Object.freeze(
      this.columnOrder().map((key) => {
        const column = this.columns.find((candidate) => candidate.key === key);
        if (!column) {
          throw new Error(`[Shipments] Unknown configured column key "${key}".`);
        }
        return Object.freeze({
          key: column.key,
          label: column.label,
          visible: visibleKeys.has(column.key),
          hideable: true,
          reorderable: true,
        });
      }),
    );
  });

  protected readonly viewState = computed(() =>
    Object.freeze({
      visibleColumnKeys: this.visibleColumnKeys(),
      columnOrder: Object.freeze([...this.columnOrder(), 'actions']),
    }),
  );

  protected readonly activeFilterCount = computed(() =>
    SHIPMENT_FILTER_FIELDS.reduce(
      (count, field) => count + (isActiveFilterValue(this.appliedFilters()[field.key]) ? 1 : 0),
      0,
    ),
  );

  protected readonly filteredRows = computed<readonly Shipment[]>(() =>
    this.filterRows(SHIPMENTS_MOCK, this.appliedFilters()),
  );

  protected readonly pagination = computed(() => ({
    page: this.page(),
    pageSize: this.pageSize(),
    totalItems: this.filteredRows().length,
  }));

  protected readonly visibleRows = computed<readonly Shipment[]>(() => {
    const rows = this.sortRows(this.filteredRows(), this.sort());
    const start = (this.page() - 1) * this.pageSize();
    return rows.slice(start, start + this.pageSize());
  });

  protected readonly resolvedTableState = computed<TableDataState>(() => {
    const state = this.tableState();
    if (
      state.kind === 'ready' &&
      this.activeFilterCount() > 0 &&
      this.filteredRows().length === 0
    ) {
      return {
        kind: 'no-results',
        title: { key: 'STARLINKS.SHIPMENTS.FILTERS.FILTERED_EMPTY_TITLE' },
        description: { key: 'STARLINKS.SHIPMENTS.FILTERS.FILTERED_EMPTY_DESCRIPTION' },
      };
    }
    return state;
  });

  protected readonly statusColumn: TableStatusColumn<Shipment> = {
    key: 'status',
    label: { key: 'STARLINKS.SHIPMENTS.COLUMNS.STATUS' },
    type: 'status',
    field: 'status',
    sortable: true,
    width: '7.5rem',
    minWidth: '7.5rem',
    resolveStatus: (row) => this.statusDisplay(row),
  };

  protected readonly columns: readonly DynamicTableColumn<Shipment>[] = [
    {
      key: 'shipmentNumber',
      label: { key: 'STARLINKS.SHIPMENTS.COLUMNS.SHIPMENT_NUMBER' },
      type: 'custom',
      field: 'shipmentNumber',
      sortable: true,
      sortKey: 'shipmentNumber',
      width: '8.5rem',
      minWidth: '8.5rem',
    },
    {
      key: 'customerReference',
      label: { key: 'STARLINKS.SHIPMENTS.COLUMNS.CUSTOMER_REFERENCE' },
      type: 'text',
      field: 'customerReference',
      sortable: true,
      width: '7.25rem',
      minWidth: '7.25rem',
    },
    {
      key: 'service',
      label: { key: 'STARLINKS.SHIPMENTS.COLUMNS.SERVICE' },
      type: 'text',
      valueAccessor: (row) => this.serviceLabel(row.service),
      sortable: true,
      sortKey: 'service',
      width: '7rem',
      minWidth: '7rem',
    },
    {
      key: 'route',
      label: { key: 'STARLINKS.SHIPMENTS.COLUMNS.ROUTE' },
      type: 'custom',
      width: '9.5rem',
      minWidth: '9.5rem',
    },
    {
      key: 'pickupDate',
      label: { key: 'STARLINKS.SHIPMENTS.COLUMNS.PICKUP_DATE' },
      type: 'date',
      field: 'pickupDate',
      dateFormat: { kind: 'pattern', pattern: 'd/M/yyyy', timeZone: 'UTC' },
      sortable: true,
      width: '7.5rem',
      minWidth: '7.5rem',
    },
    {
      key: 'expectedDeliveryDate',
      label: { key: 'STARLINKS.SHIPMENTS.COLUMNS.EXPECTED_DELIVERY_DATE' },
      type: 'date',
      field: 'expectedDeliveryDate',
      dateFormat: { kind: 'pattern', pattern: 'd/M/yyyy', timeZone: 'UTC' },
      sortable: true,
      width: '9.25rem',
      minWidth: '9.25rem',
    },
    {
      key: 'progress',
      label: { key: 'STARLINKS.SHIPMENTS.COLUMNS.PROGRESS' },
      type: 'progress',
      field: 'progress',
      sortable: true,
      width: '7rem',
      minWidth: '7rem',
      resolveProgress: (row) => ({
        value: row.progress,
        tone: PROGRESS_TONES[row.status],
      }),
    },
    this.statusColumn,
    {
      key: 'actions',
      label: { key: 'STARLINKS.SHIPMENTS.COLUMNS.ACTIONS' },
      type: 'actions',
      width: '7.25rem',
      minWidth: '7.25rem',
      cellAlign: 'center',
      headerAlign: 'center',
      sticky: 'inline-end',
      required: true,
      actions: [
        this.action('print', 'printer', 'default'),
        this.action('confirm', 'tick-circle', 'success'),
        this.action('cancel', 'close-circle', 'danger'),
      ],
    },
  ];

  protected handleSortChange(sort: TableSort | null): void {
    this.sort.set(sort);
    this.page.set(1);
  }

  protected handlePageChange(change: TablePageChange): void {
    this.page.set(change.page);
    this.pageSize.set(change.pageSize);
  }

  protected handleActionTriggered(event: TableActionEvent<Shipment>): void {
    this.lastAction.set(event);
  }

  protected handleViewOptionChange(change: TableViewOptionChange): void {
    if (!isConfigurableColumnKey(change.key)) {
      return;
    }
    const current = new Set(this.visibleColumnKeys());
    if (change.visible) {
      current.add(change.key);
    } else {
      const visibleNonActions = COLUMN_KEYS.filter(
        (key) => key !== 'actions' && current.has(key) && key !== change.key,
      );
      if (visibleNonActions.length === 0) {
        return;
      }
      current.delete(change.key);
    }
    this.visibleColumnKeys.set(
      Object.freeze([...this.columnOrder().filter((key) => current.has(key)), 'actions']),
    );
    if (!change.visible && this.sort()?.columnKey === change.key) {
      this.sort.set(null);
    }
  }

  protected handleViewOptionsShowAll(): void {
    this.visibleColumnKeys.set(Object.freeze([...this.columnOrder(), 'actions']));
  }

  protected handleViewOptionOrderChange(change: TableViewOptionOrderChange): void {
    if (!isColumnOrderPermutation(change.orderedKeys)) {
      throw new Error('[Shipments] View Options emitted an invalid configurable column order.');
    }
    this.columnOrder.set(Object.freeze([...change.orderedKeys]));
    const visible = new Set(this.visibleColumnKeys());
    this.visibleColumnKeys.set(
      Object.freeze([...change.orderedKeys.filter((key) => visible.has(key)), 'actions']),
    );
  }

  protected handleDrawerOpened(): void {
    this.activeDrawer.set('view-options');
  }

  protected handleDrawerClosed(): void {
    if (this.activeDrawer() === 'view-options') {
      this.activeDrawer.set(null);
    }
  }

  protected handleFilterDraftChange(draft: TableFilterModel): void {
    this.filterDraft.set(draft);
  }

  protected handleFiltersApply(draft: TableFilterModel): void {
    const applied = cloneFilterModel(draft);
    this.filterDraft.set(applied);
    this.appliedFilters.set(applied);
    this.page.set(1);
  }

  protected handleFiltersReset(): void {
    const empty = cloneFilterModel(EMPTY_SHIPMENT_FILTERS);
    this.filterDraft.set(empty);
    this.appliedFilters.set(empty);
    this.page.set(1);
  }

  protected handleRetry(): void {
    this.tableState.set({ kind: 'ready' });
  }

  protected handleSearchFieldChange(fieldKey: string): void {
    if (!isShipmentSearchFieldKey(fieldKey)) {
      return;
    }
    this.selectedSearchField.set(fieldKey);
    this.searchQuery.set('');
    this.resetSearchSuggestions();
  }

  protected handleSearchQueryChange(query: string): void {
    this.searchQuery.set(query);
    this.updateSearchSuggestions(query, this.selectedSearchField());
  }

  protected handleSuggestionSelected(suggestion: TableSearchSuggestion<Shipment>): void {
    const fieldKey = this.selectedSearchField();
    if (!fieldKey) {
      return;
    }
    const value = this.searchDisplayValue(suggestion.value, fieldKey);
    this.searchQuery.set(value);
    this.resetSearchSuggestions();

    // Newest-first, unique per field/shipment, capped for the compact overlay.
    const recent: TableRecentSearch = Object.freeze({
      id: `selected-${fieldKey}-${suggestion.id}`,
      fieldKey,
      value,
    });
    this.recentSearches.update((items) =>
      Object.freeze([recent, ...items.filter((item) => item.id !== recent.id)].slice(0, 5)),
    );
  }

  protected handleRecentSearchSelected(recent: TableRecentSearch): void {
    if (!isShipmentSearchFieldKey(recent.fieldKey)) {
      return;
    }
    this.selectedSearchField.set(recent.fieldKey);
    this.searchQuery.set(recent.value);
    this.updateSearchSuggestions(recent.value, recent.fieldKey);
  }

  protected handleClearSearch(): void {
    this.selectedSearchField.set(null);
    this.searchQuery.set('');
    this.resetSearchSuggestions();
  }

  protected handleClearRecent(): void {
    this.recentSearches.set(Object.freeze([]));
  }

  protected handleSearchRetry(): void {
    this.updateSearchSuggestions(this.searchQuery(), this.selectedSearchField());
  }

  protected locationKey(location: ShipmentLocation): string {
    return `STARLINKS.SHIPMENTS.LOCATIONS.${location.toUpperCase()}`;
  }

  protected statusDisplay(shipment: Shipment): TableStatusDisplay {
    return {
      label: {
        key: `STARLINKS.SHIPMENTS.STATUSES.${this.translationSegment(shipment.status)}`,
      },
      tone: STATUS_TONES[shipment.status],
    };
  }

  private action(id: ShipmentActionId, icon: string, variant: 'default' | 'success' | 'danger') {
    const segment = id.toUpperCase();
    return {
      id,
      icon,
      variant,
      label: { key: `STARLINKS.SHIPMENTS.ACTIONS.${segment}` },
      tooltip: { key: `STARLINKS.SHIPMENTS.ACTIONS.${segment}_TOOLTIP` },
      visible: (row: Shipment) => row.availableActions.includes(id),
    } as const;
  }

  private serviceLabel(service: ShipmentService): string {
    return this.translate.instant(
      `STARLINKS.SHIPMENTS.SERVICES.${this.translationSegment(service)}`,
    );
  }

  private updateSearchSuggestions(query: string, fieldKey: ShipmentSearchFieldKey | null): void {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!fieldKey || normalizedQuery.length < MINIMUM_SEARCH_LENGTH) {
      this.resetSearchSuggestions();
      return;
    }

    const matches = SHIPMENTS_MOCK.filter((shipment) =>
      this.searchValues(shipment, fieldKey).some((value) =>
        value.toLocaleLowerCase().includes(normalizedQuery),
      ),
    );
    const suggestions = Object.freeze(
      matches.map((shipment) => Object.freeze({ id: shipment.id, value: shipment })),
    );
    this.searchSuggestions.set(suggestions);
    this.searchSuggestionsState.set(suggestions.length > 0 ? { kind: 'ready' } : { kind: 'empty' });
  }

  private searchValues(shipment: Shipment, fieldKey: ShipmentSearchFieldKey): readonly string[] {
    switch (fieldKey) {
      case 'shipmentNumber':
        return [shipment.shipmentNumber];
      case 'customerReference':
        return [shipment.customerReference];
      case 'service':
        return [shipment.service, this.serviceLabel(shipment.service)];
      case 'origin':
        return [shipment.origin, this.translate.instant(this.locationKey(shipment.origin))];
      case 'destination':
        return [
          shipment.destination,
          this.translate.instant(this.locationKey(shipment.destination)),
        ];
    }
  }

  private searchDisplayValue(shipment: Shipment, fieldKey: ShipmentSearchFieldKey): string {
    switch (fieldKey) {
      case 'shipmentNumber':
        return shipment.shipmentNumber;
      case 'customerReference':
        return shipment.customerReference;
      case 'service':
        return this.serviceLabel(shipment.service);
      case 'origin':
        return this.translate.instant(this.locationKey(shipment.origin));
      case 'destination':
        return this.translate.instant(this.locationKey(shipment.destination));
    }
  }

  private resetSearchSuggestions(): void {
    this.searchSuggestions.set(Object.freeze([]));
    this.searchSuggestionsState.set({ kind: 'idle' });
  }

  private filterRows(rows: readonly Shipment[], filters: TableFilterModel): readonly Shipment[] {
    const shipmentNumber = stringFilter(filters['shipmentNumber']).trim().toLocaleLowerCase();
    const customerReference = stringFilter(filters['customerReference']).trim().toLocaleLowerCase();
    const service = stringFilter(filters['service']);
    const origin = stringFilter(filters['origin']);
    const destination = stringFilter(filters['destination']);
    const pickupDate = stringFilter(filters['pickupDate']);
    const expectedDeliveryDate = stringFilter(filters['expectedDeliveryDate']);
    const statuses = arrayFilter(filters['status']);
    const period = stringFilter(filters['period']);

    return Object.freeze(
      rows.filter(
        (row) =>
          (!shipmentNumber || row.shipmentNumber.toLocaleLowerCase().includes(shipmentNumber)) &&
          (!customerReference ||
            row.customerReference.toLocaleLowerCase().includes(customerReference)) &&
          (!service || row.service === service) &&
          (!origin || row.origin === origin) &&
          (!destination || row.destination === destination) &&
          (!pickupDate || row.pickupDate === pickupDate) &&
          (!expectedDeliveryDate || row.expectedDeliveryDate === expectedDeliveryDate) &&
          (statuses.length === 0 || statuses.includes(row.status)) &&
          matchesPickupPeriod(row.pickupDate, period),
      ),
    );
  }

  private translationSegment(value: ShipmentStatus | ShipmentService): string {
    return value.replaceAll('-', '_').toUpperCase();
  }

  private sortRows(rows: readonly Shipment[], sort: TableSort | null): readonly Shipment[] {
    if (!sort) {
      return rows;
    }

    const direction = sort.direction === 'asc' ? 1 : -1;
    return [...rows].sort((first, second) => {
      const firstValue = this.sortValue(first, sort.sortKey);
      const secondValue = this.sortValue(second, sort.sortKey);
      return firstValue.localeCompare(secondValue, 'en', { numeric: true }) * direction;
    });
  }

  private sortValue(row: Shipment, sortKey: string): string {
    switch (sortKey) {
      case 'shipmentNumber':
        return row.shipmentNumber;
      case 'customerReference':
        return row.customerReference;
      case 'service':
        return row.service;
      case 'pickupDate':
        return row.pickupDate;
      case 'expectedDeliveryDate':
        return row.expectedDeliveryDate;
      case 'progress':
        return String(row.progress).padStart(3, '0');
      case 'status':
        return row.status;
      default:
        return '';
    }
  }
}

function isShipmentSearchFieldKey(value: string): value is ShipmentSearchFieldKey {
  return SEARCH_FIELD_KEYS.includes(value as ShipmentSearchFieldKey);
}

function locationFilterOptions() {
  return Object.freeze(
    (['riyadh', 'makkah', 'tabuk', 'khobar'] as const).map((location) =>
      Object.freeze({
        value: location,
        label: { key: `STARLINKS.SHIPMENTS.LOCATIONS.${location.toUpperCase()}` },
      }),
    ),
  );
}

function statusFilterOption(
  status: ShipmentStatus,
  tone: 'success' | 'warning' | 'info' | 'danger' | 'accent',
) {
  return Object.freeze({
    value: status,
    tone,
    label: { key: `STARLINKS.SHIPMENTS.STATUSES.${status.replaceAll('-', '_').toUpperCase()}` },
  });
}

function summaryCard(
  key: string,
  labelKey: string,
  value: string | number,
  icon: string,
  tone: SummaryCardTone,
  trend?: SummaryCardTrend,
): ShipmentSummaryCard {
  return Object.freeze({
    key,
    label: Object.freeze({ key: `STARLINKS.SHIPMENTS.SUMMARY.${labelKey}` }),
    value,
    icon,
    tone,
    ...(trend ? { trend: Object.freeze(trend) } : {}),
  });
}

function isColumnOrderPermutation(keys: readonly string[]): boolean {
  return (
    keys.length === CONFIGURABLE_COLUMN_KEYS.length &&
    new Set(keys).size === CONFIGURABLE_COLUMN_KEYS.length &&
    keys.every(isConfigurableColumnKey)
  );
}

function isConfigurableColumnKey(
  value: string,
): value is (typeof CONFIGURABLE_COLUMN_KEYS)[number] {
  return CONFIGURABLE_COLUMN_KEYS.some((key) => key === value);
}

function matchesPickupPeriod(pickupDate: string, period: string): boolean {
  if (!period) {
    return true;
  }
  const days = PERIOD_DAYS[period as keyof typeof PERIOD_DAYS];
  if (!days) {
    return true;
  }
  const reference = Date.parse(`${MOCK_PERIOD_REFERENCE_DATE}T00:00:00Z`);
  const pickup = Date.parse(`${pickupDate}T00:00:00Z`);
  const start = reference - (days - 1) * 24 * 60 * 60 * 1000;
  return Number.isFinite(pickup) && pickup >= start && pickup <= reference;
}

function stringFilter(value: TableFilterModel[string]): string {
  return typeof value === 'string' ? value : '';
}

function arrayFilter(value: TableFilterModel[string]): readonly string[] {
  return Array.isArray(value) ? value : [];
}

function isActiveFilterValue(value: TableFilterModel[string]): boolean {
  return Array.isArray(value)
    ? value.length > 0
    : typeof value === 'string' && value.trim().length > 0;
}

function cloneFilterModel(model: TableFilterModel): TableFilterModel {
  return Object.freeze(
    Object.fromEntries(
      Object.entries(model).map(([key, value]) => [
        key,
        Array.isArray(value) ? Object.freeze([...value]) : value,
      ]),
    ),
  );
}
