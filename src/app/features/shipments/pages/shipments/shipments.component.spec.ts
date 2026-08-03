import { formatDate, registerLocaleData } from '@angular/common';
import localeAr from '@angular/common/locales/ar';
import { Signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService, TranslationObject } from '@ngx-translate/core';

import { DynamicTableComponent } from '../../../../shared/components/dynamic-table/dynamic-table.component';
import {
  TableActionEvent,
  TableDataState,
  TableSort,
} from '../../../../shared/components/dynamic-table/dynamic-table.types';
import { SHIPMENTS_MOCK } from '../../data/shipments.mock';
import { Shipment } from '../../models/shipment.model';
import { TableSearchComponent } from '../../../../shared/components/table-search/table-search.component';
import {
  TableRecentSearch,
  TableSearchSuggestion,
  TableSearchSuggestionsState,
} from '../../../../shared/components/table-search/table-search.types';
import {
  TableFilterField,
  TableFilterModel,
  TableViewOption,
} from '../../../../shared/components/table-toolbar/table-toolbar.types';
import { TableFiltersComponent } from '../../../../shared/components/table-toolbar/table-filters.component';
import { TableViewOptionsComponent } from '../../../../shared/components/table-toolbar/table-view-options.component';
import { ShipmentsComponent } from './shipments.component';

registerLocaleData(localeAr);

describe('ShipmentsComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ShipmentsComponent],
      providers: [provideRouter([]), provideTranslateService({ fallbackLang: 'en', lang: 'en' })],
    });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', englishTranslations());
    translate.setTranslation('ar', arabicTranslations());
  });

  afterEach(() => {
    document.documentElement.dir = 'ltr';
  });

  it('creates and renders all nine expected columns and mock rows', () => {
    const fixture = createFixture();
    const headers = Array.from(
      fixture.nativeElement.querySelectorAll('thead [data-column-key]') as NodeListOf<HTMLElement>,
    ).map((header) => header.dataset['columnKey']);

    expect(fixture.componentInstance).toBeTruthy();
    expect(headers).toEqual([
      'shipmentNumber',
      'customerReference',
      'service',
      'route',
      'pickupDate',
      'expectedDeliveryDate',
      'progress',
      'status',
      'actions',
    ]);
    expect(fixture.nativeElement.querySelectorAll('.dynamic-table__data-row')).toHaveLength(9);
  });

  it('renders only Search and View Options above and outside the table wrapper', () => {
    const fixture = createFixture();
    const page = fixture.nativeElement.querySelector('.shipments-page') as HTMLElement;
    const toolbar = page.querySelector('.shipments-table-toolbar') as HTMLElement;
    const search = toolbar.querySelector('app-table-search') as HTMLElement;
    const viewOptions = toolbar.querySelector('app-table-view-options') as HTMLElement;
    const table = page.querySelector('app-dynamic-table') as HTMLElement;
    const tableCard = page.querySelector('.shipments-table-card') as HTMLElement;

    expect(search).toBeTruthy();
    expect(viewOptions).toBeTruthy();
    expect(toolbar.querySelector('app-table-filters')).toBeNull();
    expect(toolbar.textContent).not.toContain('Filters');
    expect(TableFiltersComponent).toBeDefined();
    expect(table).toBeTruthy();
    expect(
      [
        ...toolbar.querySelectorAll('app-table-search, app-table-view-options, app-table-filters'),
      ].map((element) => element.tagName.toLowerCase()),
    ).toEqual(['app-table-search', 'app-table-view-options']);
    expect(search.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(search.closest('.dynamic-table__overflow')).toBeNull();
    expect(toolbar.classList).toContain('shipments-table-toolbar');
    expect(toolbar.getAttribute('class')).toContain('shipments-table-toolbar');
    expect(toolbar.closest('.shipments-table-card')).toBe(tableCard);
    expect(table.closest('.shipments-table-card')).toBe(tableCard);
  });

  it('leaves page-title ownership to the shell and renders summary before the table card', () => {
    const fixture = createFixture();
    const page = fixture.nativeElement.querySelector('.shipments-page') as HTMLElement;
    const summary = page.querySelector('.shipments-summary') as HTMLElement;
    const tableCard = page.querySelector('.shipments-table-card') as HTMLElement;
    const toolbar = page.querySelector('app-table-toolbar') as HTMLElement;
    const table = page.querySelector('app-dynamic-table') as HTMLElement;

    expect(page.querySelector('app-page-section-header')).toBeNull();
    expect(page.querySelector('h1')).toBeNull();
    expect(summary.compareDocumentPosition(tableCard) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(tableCard.querySelector('h2')?.textContent).toContain('Recent Shipments');
    expect(tableCard.querySelector('.shipments-table-card__copy p')?.textContent).toContain(
      'Track all shipments on your account',
    );
    expect(toolbar.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(table.querySelector('app-table-pagination')).toBeTruthy();
  });

  it('renders inert Add and Export controls in the table-card header', () => {
    const fixture = createFixture();
    const signals = componentSignals(fixture);
    const beforePage = signals.page();
    const add = fixture.nativeElement.querySelector(
      '.shipments-table-card__add',
    ) as HTMLButtonElement;
    const exportButton = fixture.nativeElement.querySelector(
      '.shipments-table-card__export',
    ) as HTMLButtonElement;

    expect(add.type).toBe('button');
    expect(add.textContent).toContain('Add Shipment');
    expect(add.querySelector('iconsax-icon[name="add"][type="linear"]')).toBeTruthy();
    expect(exportButton.type).toBe('button');
    expect(exportButton.textContent).toContain('Export');
    expect(
      exportButton.querySelector('iconsax-icon[name="export-arrow-02"][type="linear"]'),
    ).toBeTruthy();

    add.click();
    exportButton.click();
    fixture.detectChanges();
    expect(signals.page()).toBe(beforePage);
    expect(signals.lastAction()).toBeNull();
  });

  it('renders the six immutable portfolio summary cards in the supplied order', () => {
    const fixture = createFixture();
    const cards = [...fixture.nativeElement.querySelectorAll('app-summary-card')];
    const labels = cards.map((card) =>
      (card.querySelector('.summary-card__label') as HTMLElement).textContent?.trim(),
    );
    const values = cards.map((card) =>
      (card.querySelector('.summary-card__value') as HTMLElement).textContent?.trim(),
    );
    const icons = cards.map((card) => card.querySelector('iconsax-icon')?.getAttribute('name'));

    expect(cards).toHaveLength(6);
    expect(labels).toEqual([
      'In Transit',
      'Out for Delivery',
      'Exception',
      'On-Time Rate',
      'Fully Delivered',
      'Total Shipments',
    ]);
    expect(values).toEqual(['415', '415', '14', '97%', '415', '14,213']);
    expect(icons).toEqual(['truck', 'truck-time', 'danger', 'timer', 'box-tick', 'box']);
    expect(cards[3].querySelector('iconsax-icon[name="arrow-up-02"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.shipments-summary button')).toBeNull();
    expect(fixture.nativeElement.querySelector('.shipments-summary a')).toBeNull();
    expect(Object.isFrozen(componentSignals(fixture).summaryCards)).toBe(true);
  });

  it('keeps summary cards independent from all search, filter, layout, sort, and page state', () => {
    const fixture = createFixture();
    const signals = componentSignals(fixture);
    const summary = signals.summaryCards;
    const values = () =>
      [...fixture.nativeElement.querySelectorAll('.summary-card__value')].map((value) =>
        (value as HTMLElement).textContent?.trim(),
      );
    const initialValues = values();

    signals.handleSearchFieldChange('shipmentNumber');
    signals.handleSearchQueryChange('5678');
    signals.handleFilterDraftChange({ ...emptyFilters(), service: '3pl' });
    signals.handleFiltersApply(signals.filterDraft());
    signals.handleViewOptionChange({ key: 'progress', visible: false });
    signals.handleViewOptionOrderChange({
      orderedKeys: [
        'status',
        'shipmentNumber',
        'customerReference',
        'service',
        'route',
        'pickupDate',
        'expectedDeliveryDate',
        'progress',
      ],
    });
    signals.sort.set({ columnKey: 'shipmentNumber', sortKey: 'shipmentNumber', direction: 'desc' });
    signals.handlePageChange({ page: 2, pageSize: 2 });
    fixture.detectChanges();

    expect(signals.summaryCards).toBe(summary);
    expect(values()).toEqual(initialValues);
  });

  it('configures five stable readonly fields and representative recent searches', () => {
    const fixture = createFixture();
    const search = searchComponent(fixture);
    const fields = search.fields();
    const searchInput = fixture.nativeElement.querySelector(
      '.table-search__input',
    ) as HTMLInputElement;
    searchInput.focus();
    fixture.detectChanges();

    expect(fields.map((field) => field.key)).toEqual([
      'shipmentNumber',
      'customerReference',
      'service',
      'origin',
      'destination',
    ]);
    expect(Object.isFrozen(fields)).toBe(true);
    expect(fields.every((field) => Object.isFrozen(field))).toBe(true);
    expect(fixture.nativeElement.querySelectorAll('.table-search__recent')).toHaveLength(4);
    expect(search.recentSearches()).toBe(componentSignals(fixture).recentSearches());
  });

  it.each([
    ['shipmentNumber', '  5678  ', 'SLK-2025-5678'],
    ['customerReference', 'ab-5678-c', 'SLK-2025-1234'],
    ['service', 'FREIGHT-FORWARD', 'SLK-2025-1234'],
    ['origin', 'KHOBAR', 'SLK-2025-5678'],
    ['destination', 'TABUK', 'SLK-2024-8841'],
  ] as const)('matches %s immutably and case-insensitively', (field, query, shipmentNumber) => {
    const fixture = createFixture();
    const signals = componentSignals(fixture);
    signals.handleSearchFieldChange(field);
    signals.handleSearchQueryChange(query);

    expect(signals.searchQuery()).toBe(query);
    expect(signals.searchSuggestionsState()).toEqual({ kind: 'ready' });
    expect(signals.searchSuggestions()[0].value.shipmentNumber).toBe(shipmentNumber);
    expect(SHIPMENTS_MOCK.map((shipment) => shipment.shipmentNumber)).toContain(shipmentNumber);
  });

  it('uses idle below the minimum and empty when a qualifying query does not match', () => {
    const fixture = createFixture();
    const signals = componentSignals(fixture);
    signals.handleSearchFieldChange('shipmentNumber');
    signals.handleSearchQueryChange('S');
    expect(signals.searchSuggestions()).toEqual([]);
    expect(signals.searchSuggestionsState()).toEqual({ kind: 'idle' });

    signals.handleSearchQueryChange('does-not-exist');
    expect(signals.searchSuggestions()).toEqual([]);
    expect(signals.searchSuggestionsState()).toEqual({ kind: 'empty' });
  });

  it('resets controlled query and suggestions on field changes without changing rows or recents', () => {
    const fixture = createFixture();
    const signals = componentSignals(fixture);
    const recent = signals.recentSearches();
    const rows = tableComponent(fixture).rows();
    signals.handleSearchFieldChange('shipmentNumber');
    signals.handleSearchQueryChange('5678');
    signals.handleSearchFieldChange('service');

    expect(signals.selectedSearchField()).toBe('service');
    expect(signals.searchQuery()).toBe('');
    expect(signals.searchSuggestions()).toEqual([]);
    expect(signals.searchSuggestionsState()).toEqual({ kind: 'idle' });
    expect(signals.recentSearches()).toBe(recent);
    expect(tableComponent(fixture).rows()).toBe(rows);
  });

  it('renders the typed suggestion template with localized status, location, and progress', () => {
    const fixture = createFixture();
    const signals = componentSignals(fixture);
    signals.handleSearchFieldChange('shipmentNumber');
    signals.handleSearchQueryChange('5678');
    fixture.detectChanges();
    const searchInput = fixture.nativeElement.querySelector(
      '.table-search__input',
    ) as HTMLInputElement;
    searchInput.focus();
    fixture.detectChanges();
    const option = fixture.nativeElement.querySelector('.shipments-search-option') as HTMLElement;

    expect(option.textContent).toContain('SLK-2025-5678');
    expect(option.textContent).toContain('In transit');
    expect(option.textContent).toContain('Riyadh');
    expect(option.textContent).toContain('30%');
    expect(option.querySelector('app-table-status-cell')).toBeTruthy();
  });

  it('keeps suggestion and recent selections controlled and updates recent data immutably', () => {
    const fixture = createFixture();
    const signals = componentSignals(fixture);
    signals.handleSearchFieldChange('shipmentNumber');
    signals.handleSearchQueryChange('5678');
    const selected = signals.searchSuggestions()[0];
    const oldRecent = signals.recentSearches();
    signals.handleSuggestionSelected(selected);

    expect(signals.selectedSearchField()).toBe('shipmentNumber');
    expect(signals.searchQuery()).toBe('SLK-2025-5678');
    expect(signals.searchSuggestions()).toEqual([]);
    expect(signals.searchSuggestionsState()).toEqual({ kind: 'idle' });
    expect(signals.recentSearches()).not.toBe(oldRecent);
    expect(signals.recentSearches()[0].fieldKey).toBe('shipmentNumber');

    const recent = oldRecent[2];
    signals.handleRecentSearchSelected(recent);
    expect(signals.selectedSearchField()).toBe('service');
    expect(signals.searchQuery()).toBe('last-mile');
    expect(signals.searchSuggestionsState()).toEqual({ kind: 'ready' });
  });

  it('clears search and recents independently and can retry synchronous matching', () => {
    const fixture = createFixture();
    const signals = componentSignals(fixture);
    signals.handleSearchFieldChange('origin');
    signals.handleSearchQueryChange('khobar');
    const recent = signals.recentSearches();
    signals.searchSuggestionsState.set({ kind: 'error', retryable: true });
    signals.handleSearchRetry();
    expect(signals.searchSuggestionsState()).toEqual({ kind: 'ready' });

    signals.handleClearSearch();
    expect(signals.selectedSearchField()).toBeNull();
    expect(signals.searchQuery()).toBe('');
    expect(signals.recentSearches()).toBe(recent);

    signals.handleClearRecent();
    expect(signals.recentSearches()).toEqual([]);
    expect(signals.recentSearches()).not.toBe(recent);
    expect(Object.isFrozen(signals.recentSearches())).toBe(true);
  });

  it('uses configured linear Iconsax toolbar icons without restoring the Filters trigger', () => {
    const fixture = createFixture();
    const signals = componentSignals(fixture);
    const searchInput = fixture.nativeElement.querySelector(
      '.table-search__input',
    ) as HTMLInputElement;
    searchInput.focus();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('iconsax-icon[name="search-normal"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('iconsax-icon[name="clock"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('iconsax-icon[name="setting-4"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('iconsax-icon[name="filter"]')).toBeNull();

    signals.handleSearchFieldChange('shipmentNumber');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('iconsax-icon[name="close-circle"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.pi')).toBeNull();
    expect(fixture.nativeElement.querySelector('.page-section-header')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.summary-card')).toHaveLength(6);
    expect(fixture.nativeElement.querySelector('app-table-filters')).toBeNull();
  });

  it('renders safe shipment links and indicators only for configured rows', () => {
    const fixture = createFixture();
    const links = fixture.nativeElement.querySelectorAll(
      '.shipments-number-cell__link',
    ) as NodeListOf<HTMLAnchorElement>;

    expect(links).toHaveLength(9);
    expect(links[0].textContent?.trim()).toBe('SLK-2025-1234');
    expect(links[0].getAttribute('href')).toContain('/app/shipments?shipment=shipment-2025-1234');
    expect(
      fixture.nativeElement.querySelectorAll('.shipments-number-cell__indicator'),
    ).toHaveLength(SHIPMENTS_MOCK.filter((row) => row.hasShipmentIndicator).length);
    const indicator = fixture.nativeElement.querySelector(
      '.shipments-number-cell__indicator',
    ) as HTMLElement;
    expect(indicator.getAttribute('name')).toBe('profile-2user');
    expect(indicator.getAttribute('type')).toBe('linear');
    expect(indicator.getAttribute('size')).toBe('14');
    expect(indicator.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders translated service and origin/destination feature cells', () => {
    const fixture = createFixture();
    const firstRow = fixture.nativeElement.querySelector('.dynamic-table__data-row') as HTMLElement;

    expect(firstRow.querySelector('[data-column-key="service"]')?.textContent).toContain(
      'Freight forward',
    );
    expect(firstRow.querySelector('.shipments-route-cell')?.textContent).toContain('Riyadh');
    expect(firstRow.querySelector('.shipments-route-cell')?.textContent).toContain('Makkah');
    const separator = firstRow.querySelector('.shipments-route-cell__separator') as HTMLElement;
    expect(separator.getAttribute('name')).toBe('arrow-right-01');
    expect(separator.getAttribute('type')).toBe('linear');
    expect(separator.getAttribute('size')).toBe('14');
    expect(separator.getAttribute('aria-hidden')).toBe('true');
    expect(firstRow.querySelector('.shipments-route-cell')?.textContent).not.toMatch(/[←→↑↓]/u);
  });

  it('renders predictable date patterns through the built-in date cell', () => {
    const fixture = createFixture();
    const firstRow = fixture.nativeElement.querySelector('.dynamic-table__data-row') as HTMLElement;

    expect(firstRow.querySelector('[data-column-key="pickupDate"]')?.textContent?.trim()).toBe(
      formatDate(new Date(SHIPMENTS_MOCK[0].pickupDate), 'd/M/yyyy', 'en', 'UTC'),
    );
    expect(
      firstRow.querySelector('[data-column-key="expectedDeliveryDate"]')?.textContent?.trim(),
    ).toBe(formatDate(new Date(SHIPMENTS_MOCK[0].expectedDeliveryDate), 'd/M/yyyy', 'en', 'UTC'));
  });

  it('maps all shipment statuses to translated semantic badges', () => {
    const fixture = createFixture();
    const badges = fixture.nativeElement.querySelectorAll(
      '.table-status-cell',
    ) as NodeListOf<HTMLElement>;
    const tones = new Map(
      SHIPMENTS_MOCK.map((row, index) => [row.status, badges[index].dataset['tone']]),
    );

    expect(new Set(SHIPMENTS_MOCK.map((row) => row.status))).toEqual(
      new Set(['picked-up', 'delivered', 'in-transit', 'exception', 'out-for-delivery']),
    );
    expect(tones.get('picked-up')).toBe('warning');
    expect(tones.get('delivered')).toBe('success');
    expect(tones.get('in-transit')).toBe('info');
    expect(tones.get('exception')).toBe('danger');
    expect(tones.get('out-for-delivery')).toBe('accent');
    expect(Array.from(badges).map((badge) => badge.textContent?.trim())).toContain('Picked up');
  });

  it('renders all required progress values with feature-owned semantic tones', () => {
    const fixture = createFixture();
    const progress = fixture.nativeElement.querySelectorAll(
      '[role="progressbar"]',
    ) as NodeListOf<HTMLElement>;

    expect(Array.from(progress).map((item) => Number(item.getAttribute('aria-valuenow')))).toEqual(
      SHIPMENTS_MOCK.map((row) => row.progress),
    );
    expect(progress[0].dataset['tone']).toBe('warning');
    expect(progress[1].dataset['tone']).toBe('success');
    expect(progress[2].dataset['tone']).toBe('info');
    expect(progress[3].dataset['tone']).toBe('danger');
  });

  it('renders configured action combinations and records action events without mutating rows', () => {
    const fixture = createFixture();
    const rows = fixture.nativeElement.querySelectorAll(
      '.dynamic-table__data-row',
    ) as NodeListOf<HTMLElement>;
    const firstRowActions = rows[0].querySelectorAll('button');
    const secondRowActions = rows[1].querySelectorAll('button');

    expect(firstRowActions).toHaveLength(3);
    expect(secondRowActions).toHaveLength(1);
    const firstRowIcons = Array.from(firstRowActions).map((button) =>
      button.querySelector('iconsax-icon'),
    );
    expect(firstRowIcons.map((icon) => icon?.getAttribute('name'))).toEqual([
      'printer',
      'tick-circle',
      'close-circle',
    ]);
    expect(firstRowIcons.every((icon) => icon?.getAttribute('type') === 'linear')).toBe(true);
    expect(firstRowIcons.every((icon) => icon?.getAttribute('size') === '16')).toBe(true);
    expect(Array.from(firstRowActions).every((button) => button.getAttribute('aria-label'))).toBe(
      true,
    );
    const actionsHeader = fixture.nativeElement.querySelector(
      'thead [data-column-key="actions"]',
    ) as HTMLElement;
    const actionsCell = rows[0].querySelector('[data-column-key="actions"]') as HTMLElement;
    expect(actionsHeader.classList).toContain('starlinks-table__cell--sticky-end');
    expect(actionsCell.classList).toContain('starlinks-table__cell--sticky-end');
    (firstRowActions[0] as HTMLButtonElement).click();

    const lastAction = componentSignals(fixture).lastAction();
    expect(lastAction?.action.id).toBe('print');
    expect(lastAction?.row).toBe(SHIPMENTS_MOCK[0]);
    expect(lastAction?.rowId).toBe('shipment-2025-1234');
    expect(lastAction?.rowIndex).toBe(0);
    expect(Object.isFrozen(SHIPMENTS_MOCK)).toBe(true);
    expect(Object.isFrozen(SHIPMENTS_MOCK[0])).toBe(true);
    expect(Object.isFrozen(SHIPMENTS_MOCK[0].availableActions)).toBe(true);
  });

  it('updates controlled sort state and feature-owned row order', () => {
    const fixture = createFixture();
    const table = tableComponent(fixture);
    const shipmentHeader = fixture.nativeElement.querySelector(
      '[data-column-key="shipmentNumber"] button',
    ) as HTMLButtonElement;
    const sortIcon = shipmentHeader.querySelector('iconsax-icon') as HTMLElement;

    expect(sortIcon.getAttribute('name')).toBe('sort');

    shipmentHeader.click();
    fixture.detectChanges();

    expect(componentSignals(fixture).sort()).toEqual({
      columnKey: 'shipmentNumber',
      sortKey: 'shipmentNumber',
      direction: 'asc',
    });
    expect(table.sort()).toEqual(componentSignals(fixture).sort());
    expect(table.rows()[0].shipmentNumber).toBe('SLK-2024-8841');
    expect(sortIcon.getAttribute('name')).toBe('arrow-up-01');
  });

  it('paginates the complete filtered mock source after sorting', () => {
    const fixture = createFixture();
    componentSignals(fixture).pageSize.set(3);
    fixture.detectChanges();
    const table = tableComponent(fixture);
    const pageTwo = fixture.nativeElement.querySelector(
      '.table-pagination__page[aria-label="Go to page 2"]',
    ) as HTMLButtonElement;
    const visiblePageNumbers = Array.from(
      fixture.nativeElement.querySelectorAll('.table-pagination__page') as NodeListOf<HTMLElement>,
    ).map((button) => Number(button.textContent?.trim()));
    const paginationIcons = Array.from(
      fixture.nativeElement.querySelectorAll(
        'app-table-pagination iconsax-icon.table-pagination__direction-icon',
      ) as NodeListOf<HTMLElement>,
    );

    expect(visiblePageNumbers).toEqual([1, 2, 3]);
    expect(paginationIcons.map((icon) => icon.getAttribute('name'))).toEqual([
      'arrow-left-01',
      'arrow-right-01',
    ]);
    expect(fixture.nativeElement.querySelector('app-table-pagination')?.textContent).not.toMatch(
      /[←→↑↓]/u,
    );

    pageTwo.click();
    fixture.detectChanges();

    expect(componentSignals(fixture).page()).toBe(2);
    expect(table.pagination()?.page).toBe(2);
    expect(table.rows()).toHaveLength(3);
    expect(table.pagination()?.totalItems).toBe(SHIPMENTS_MOCK.length);
  });

  it('configures eight controlled reorderable view options while keeping sticky Actions feature-owned', () => {
    const fixture = createFixture();
    const signals = componentSignals(fixture);
    const options = signals.viewOptions();

    expect(options.map((option) => option.key)).toEqual([
      'shipmentNumber',
      'customerReference',
      'service',
      'route',
      'pickupDate',
      'expectedDeliveryDate',
      'progress',
      'status',
    ]);
    expect(options.every((option) => option.visible)).toBe(true);
    expect(options.every((option) => option.hideable && option.reorderable)).toBe(true);
    expect(options.some((option) => option.key === 'actions')).toBe(false);
    expect(Object.isFrozen(options)).toBe(true);
    expect(
      (tableComponent(fixture).columns().at(-1) as { readonly required?: boolean }).required,
    ).toBe(true);
  });

  it('owns only the single controlled View Options drawer state', () => {
    const fixture = createFixture();
    const signals = componentSignals(fixture);

    signals.handleDrawerOpened();
    expect(signals.activeDrawer()).toBe('view-options');
    signals.handleDrawerClosed();
    expect(signals.activeDrawer()).toBeNull();
  });

  it('opens one unified View Options drawer with the four configured sections and one Apply footer', async () => {
    const fixture = createFixture();
    const trigger = fixture.nativeElement.querySelector(
      'app-table-view-options .toolbar-trigger',
    ) as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();

    const headings = [...fixture.nativeElement.querySelectorAll('.view-options__section h3')].map(
      (heading) => (heading as HTMLElement).textContent?.trim(),
    );
    expect(fixture.nativeElement.querySelectorAll('[role="dialog"]')).toHaveLength(1);
    expect(headings).toEqual(['Table content', 'Status', 'Services', 'Period']);
    expect(fixture.nativeElement.querySelectorAll('.view-options__apply')).toHaveLength(1);
    expect(fixture.nativeElement.querySelector('app-table-filters')).toBeNull();
  });

  it('keeps unified status and service edits in draft state until Apply closes the drawer', async () => {
    const fixture = createFixture();
    const signals = componentSignals(fixture);
    const initialRows = signals.filteredRows();
    signals.page.set(2);
    const trigger = fixture.nativeElement.querySelector(
      'app-table-view-options .toolbar-trigger',
    ) as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.view-options__chip') as HTMLButtonElement).click();
    fixture.detectChanges();
    const serviceButtons = fixture.nativeElement
      .querySelectorAll('.view-options__segments')[0]
      .querySelectorAll('button');
    (serviceButtons[1] as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(signals.filterDraft()['status']).toEqual(['picked-up']);
    expect(signals.filterDraft()['service']).toBe('freight-forward');
    expect(signals.appliedFilters()['status']).toEqual([]);
    expect(signals.appliedFilters()['service']).toBeNull();
    expect(signals.filteredRows()).toBe(initialRows);
    expect(signals.page()).toBe(2);

    (fixture.nativeElement.querySelector('.view-options__apply') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(signals.appliedFilters()['status']).toEqual(['picked-up']);
    expect(signals.appliedFilters()['service']).toBe('freight-forward');
    expect(signals.page()).toBe(1);
    expect(signals.activeDrawer()).toBeNull();
    expect(viewOptionsComponent(fixture).open()).toBe(false);
  });

  it('hides columns without mutating definitions or resetting page and preserves templates/actions', () => {
    const fixture = createFixture();
    const signals = componentSignals(fixture);
    const baseColumns = tableComponent(fixture).columns();
    signals.page.set(2);
    signals.handleViewOptionChange({ key: 'customerReference', visible: false });
    fixture.detectChanges();

    expect(signals.page()).toBe(2);
    expect(tableComponent(fixture).columns()).toBe(baseColumns);
    expect(signals.visibleColumnKeys()).not.toContain('customerReference');
    expect(fixture.nativeElement.querySelector('[data-column-key="customerReference"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-column-key="shipmentNumber"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-column-key="actions"]')).toBeTruthy();
    expect(baseColumns.slice(0, -1).map((column) => column.key)).toEqual(
      signals.viewOptions().map((item) => item.key),
    );
  });

  it('keeps Actions and one data column visible and Show all restores visibility without changing order', () => {
    const fixture = createFixture();
    const signals = componentSignals(fixture);
    for (const key of signals
      .visibleColumnKeys()
      .filter((key) => key !== 'shipmentNumber' && key !== 'actions')) {
      signals.handleViewOptionChange({ key, visible: false });
    }
    signals.handleViewOptionChange({ key: 'shipmentNumber', visible: false });
    expect(signals.visibleColumnKeys()).toEqual(['shipmentNumber', 'actions']);
    signals.handleViewOptionsShowAll();
    expect(signals.visibleColumnKeys()).toHaveLength(9);
  });

  it('reorders configurable columns immutably and keeps Actions pinned at the end', () => {
    const fixture = createFixture();
    const signals = componentSignals(fixture);
    const originalColumns = tableComponent(fixture).columns();
    const reordered = [
      'status',
      'shipmentNumber',
      'customerReference',
      'service',
      'route',
      'pickupDate',
      'expectedDeliveryDate',
      'progress',
    ];
    signals.handleViewOptionOrderChange({ orderedKeys: reordered });
    fixture.detectChanges();

    expect(signals.columnOrder()).toEqual(reordered);
    expect(signals.viewOptions().map((option) => option.key)).toEqual(reordered);
    expect(tableComponent(fixture).viewState()?.columnOrder?.at(-1)).toBe('actions');
    expect(tableComponent(fixture).columns()).toBe(originalColumns);
    expect(fixture.nativeElement.querySelector('thead th:last-child')?.dataset['columnKey']).toBe(
      'actions',
    );
  });

  it('clears sort only when its column becomes hidden', () => {
    const fixture = createFixture();
    const signals = componentSignals(fixture);
    const sort: TableSort = {
      columnKey: 'shipmentNumber',
      sortKey: 'shipmentNumber',
      direction: 'asc',
    };
    signals.sort.set(sort);
    signals.handleViewOptionChange({ key: 'service', visible: false });
    expect(signals.sort()).toBe(sort);
    signals.handleViewOptionChange({ key: 'shipmentNumber', visible: false });
    expect(signals.sort()).toBeNull();
  });

  it('configures compact Status, Services, Period and six detailed immutable filters', () => {
    const fixture = createFixture();
    const signals = componentSignals(fixture);
    const fields = signals.filterFields;

    expect(fields.map((field) => field.key)).toEqual([
      'status',
      'service',
      'period',
      'shipmentNumber',
      'customerReference',
      'origin',
      'destination',
      'pickupDate',
      'expectedDeliveryDate',
    ]);
    expect(Object.isFrozen(fields)).toBe(true);
    expect(signals.viewOptionFilterFields.map((field) => field.key)).toEqual([
      'status',
      'service',
      'period',
    ]);
    expect(Object.isFrozen(signals.viewOptionFilterFields)).toBe(true);
    for (const field of fields) {
      if (field.kind === 'single-select' || field.kind === 'multiple-select') {
        const values = field.options.map((option) => option.value);
        expect(new Set(values).size).toBe(values.length);
        expect(Object.isFrozen(field.options)).toBe(true);
      }
    }
  });

  it.each([
    ['last-7-days', ['SLK-2025-1121', 'SLK-2025-2121', 'SLK-2025-1421', 'SLK-2025-1151']],
    ['last-30-days', ['SLK-2025-1121', 'SLK-2025-2121', 'SLK-2025-1421', 'SLK-2025-1151']],
    [
      'last-90-days',
      [
        'SLK-2025-1234',
        'SLK-2025-9101',
        'SLK-2025-1121',
        'SLK-2025-2121',
        'SLK-2025-1421',
        'SLK-2025-1151',
        'SLK-2025-1277',
      ],
    ],
  ] as const)('filters Pickup Date by stable mock period %s', (period, expected) => {
    const fixture = createFixture();
    const signals = componentSignals(fixture);
    signals.handleFiltersApply({ ...emptyFilters(), period });

    expect(signals.filteredRows().map((row) => row.shipmentNumber)).toEqual(expected);
  });

  it('keeps draft edits unapplied until Apply and derives the badge from applied filters only', () => {
    const fixture = createFixture();
    const signals = componentSignals(fixture);
    const sourceRows = signals.filteredRows();
    const next = { ...signals.filterDraft(), service: '3pl' };
    signals.handleFilterDraftChange(next);

    expect(signals.filterDraft()).toBe(next);
    expect(signals.appliedFilters()['service']).toBeNull();
    expect(signals.activeFilterCount()).toBe(0);
    expect(signals.filteredRows()).toBe(sourceRows);

    signals.handleFiltersApply(next);
    expect(signals.appliedFilters()).not.toBe(next);
    expect(signals.activeFilterCount()).toBe(1);
    expect(signals.filteredRows().every((row) => row.service === '3pl')).toBe(true);
  });

  it.each([
    ['shipmentNumber', '2025-56', ['SLK-2025-5678']],
    ['customerReference', 'gh-67', ['SLK-2025-1121', 'SLK-2025-1421', 'SLK-2025-1151']],
    ['service', 'last-mile', ['SLK-2024-8841', 'SLK-2025-9101']],
    ['origin', 'makkah', ['SLK-2025-1121', 'SLK-2025-2121']],
    ['destination', 'tabuk', ['SLK-2024-8841', 'SLK-2025-9101']],
    ['pickupDate', '2026-12-22', ['SLK-2025-1121', 'SLK-2025-1151']],
    ['expectedDeliveryDate', '2026-12-28', ['SLK-2025-1421']],
  ] as const)('applies %s filter semantics to the immutable source', (key, value, expected) => {
    const fixture = createFixture();
    const signals = componentSignals(fixture);
    signals.handleFiltersApply({ ...emptyFilters(), [key]: value });

    expect(signals.filteredRows().map((row) => row.shipmentNumber)).toEqual(expected);
    expect(Object.isFrozen(SHIPMENTS_MOCK)).toBe(true);
    expect(SHIPMENTS_MOCK.every((row) => Object.isFrozen(row))).toBe(true);
  });

  it('uses OR within status selections and AND across different fields', () => {
    const fixture = createFixture();
    const signals = componentSignals(fixture);
    signals.handleFiltersApply({
      ...emptyFilters(),
      origin: 'riyadh',
      status: ['exception', 'picked-up'],
    });

    expect(signals.filteredRows().map((row) => row.shipmentNumber)).toEqual([
      'SLK-2025-1234',
      'SLK-2025-1277',
    ]);
  });

  it('ignores whitespace, null, and empty arrays and preserves source order before sorting', () => {
    const fixture = createFixture();
    const signals = componentSignals(fixture);
    signals.handleFiltersApply({
      ...emptyFilters(),
      shipmentNumber: '   ',
      service: null,
      status: [],
    });

    expect(signals.filteredRows()).toEqual(SHIPMENTS_MOCK);
    expect(signals.activeFilterCount()).toBe(0);
  });

  it('processes filters before sorting and pagination and resets page while preserving page size', () => {
    const fixture = createFixture();
    const signals = componentSignals(fixture);
    signals.pageSize.set(2);
    signals.page.set(3);
    signals.sort.set({
      columnKey: 'shipmentNumber',
      sortKey: 'shipmentNumber',
      direction: 'desc',
    });
    signals.handleFiltersApply({ ...emptyFilters(), service: '3pl' });

    expect(signals.page()).toBe(1);
    expect(signals.pageSize()).toBe(2);
    expect(signals.pagination().totalItems).toBe(4);
    expect(signals.visibleRows().map((row) => row.shipmentNumber)).toEqual([
      'SLK-2025-2121',
      'SLK-2025-1421',
    ]);
    signals.handlePageChange({ page: 2, pageSize: 2 });
    expect(signals.visibleRows()).toHaveLength(2);
  });

  it('resets draft and applied filters, source total, page, while preserving search and view state', () => {
    const fixture = createFixture();
    const signals = componentSignals(fixture);
    signals.handleSearchFieldChange('shipmentNumber');
    signals.handleSearchQueryChange('5678');
    signals.handleViewOptionChange({ key: 'progress', visible: false });
    signals.handleFiltersApply({ ...emptyFilters(), service: '3pl' });
    signals.handleFiltersReset();

    expect(signals.activeFilterCount()).toBe(0);
    expect(signals.filteredRows()).toEqual(SHIPMENTS_MOCK);
    expect(signals.pagination().totalItems).toBe(SHIPMENTS_MOCK.length);
    expect(signals.page()).toBe(1);
    expect(signals.searchQuery()).toBe('5678');
    expect(signals.visibleColumnKeys()).not.toContain('progress');
  });

  it('uses the existing translated no-results state for zero filtered rows', () => {
    const fixture = createFixture();
    componentSignals(fixture).handleFiltersApply({
      ...emptyFilters(),
      shipmentNumber: 'missing-shipment',
    });
    fixture.detectChanges();

    expect(tableComponent(fixture).state().kind).toBe('no-results');
    expect(fixture.nativeElement.querySelector('.dynamic-table__state--no-results')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('No shipments match these filters');
  });

  it('keeps Phase 6 search selection and clearing independent from applied filters', () => {
    const fixture = createFixture();
    const signals = componentSignals(fixture);
    signals.handleFiltersApply({ ...emptyFilters(), service: '3pl' });
    const filtered = signals.filteredRows();
    signals.handleSearchFieldChange('shipmentNumber');
    signals.handleSearchQueryChange('5678');
    signals.handleSuggestionSelected(signals.searchSuggestions()[0]);
    signals.handleClearSearch();

    expect(signals.filteredRows()).toBe(filtered);
    expect(signals.appliedFilters()['service']).toBe('3pl');
  });

  it('reacts to English and Arabic translations and exposes RTL-safe hooks', () => {
    const fixture = createFixture();
    const translate = TestBed.inject(TranslateService);
    expect(fixture.nativeElement.querySelector('caption')?.textContent).toContain(
      'Shipments table',
    );

    document.documentElement.dir = 'rtl';
    translate.use('ar').subscribe();
    fixture.detectChanges();

    const firstRow = fixture.nativeElement.querySelector('.dynamic-table__data-row') as HTMLElement;
    expect(fixture.nativeElement.querySelector('caption')?.textContent).toContain('جدول الشحنات');
    expect(firstRow.querySelector('[data-column-key="service"]')?.textContent).toContain(
      'شحن البضائع',
    );
    expect(firstRow.querySelector('.shipments-route-cell')?.textContent).toContain('الرياض');
    expect(firstRow.querySelector('.shipments-route-cell__separator')).toBeTruthy();
    expect(firstRow.querySelector('.table-actions-cell')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-table-pagination')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.shipments-table-toolbar')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.shipments-search')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-page-section-header')).toBeNull();
    expect(fixture.nativeElement.querySelector('.shipments-table-card h2')).toBeTruthy();
  });

  it('supports every controlled table state without production developer controls', () => {
    const fixture = createFixture();
    const state = componentSignals(fixture).tableState;

    state.set({ kind: 'loading', mode: 'initial' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.dynamic-table__skeleton-row')).toBeTruthy();

    state.set({ kind: 'loading', mode: 'refresh' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.dynamic-table__refresh-indicator')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.dynamic-table__data-row')).toBeTruthy();

    for (const controlledState of [
      { kind: 'empty' },
      { kind: 'no-results' },
      { kind: 'error', display: 'replace', retryable: true },
      { kind: 'error', display: 'inline', retryable: true },
    ] as const satisfies readonly TableDataState[]) {
      state.set(controlledState);
      fixture.detectChanges();
      expect(tableComponent(fixture).state()).toEqual(controlledState);
    }

    expect(fixture.nativeElement.querySelector('.shipments-state-controls')).toBeNull();
  });
});

interface ShipmentSignals {
  readonly page: WritableSignal<number>;
  readonly pageSize: WritableSignal<number>;
  readonly sort: WritableSignal<TableSort | null>;
  readonly tableState: WritableSignal<TableDataState>;
  readonly lastAction: WritableSignal<TableActionEvent<Shipment> | null>;
  readonly selectedSearchField: WritableSignal<
    'shipmentNumber' | 'customerReference' | 'service' | 'origin' | 'destination' | null
  >;
  readonly searchQuery: WritableSignal<string>;
  readonly recentSearches: WritableSignal<readonly TableRecentSearch[]>;
  readonly searchSuggestions: WritableSignal<readonly TableSearchSuggestion<Shipment>[]>;
  readonly searchSuggestionsState: WritableSignal<TableSearchSuggestionsState>;
  readonly visibleColumnKeys: WritableSignal<readonly string[]>;
  readonly columnOrder: WritableSignal<readonly string[]>;
  readonly activeDrawer: WritableSignal<'view-options' | null>;
  readonly filterDraft: WritableSignal<TableFilterModel>;
  readonly appliedFilters: WritableSignal<TableFilterModel>;
  readonly activeFilterCount: Signal<number>;
  readonly filteredRows: Signal<readonly Shipment[]>;
  readonly visibleRows: Signal<readonly Shipment[]>;
  readonly pagination: Signal<{
    readonly page: number;
    readonly pageSize: number;
    readonly totalItems: number;
  }>;
  readonly viewOptions: Signal<readonly TableViewOption[]>;
  readonly filterFields: readonly TableFilterField[];
  readonly viewOptionFilterFields: readonly TableFilterField[];
  readonly summaryCards: readonly {
    readonly key: string;
    readonly value: string | number;
  }[];
  handleSearchFieldChange(fieldKey: string): void;
  handleSearchQueryChange(query: string): void;
  handleSuggestionSelected(suggestion: TableSearchSuggestion<Shipment>): void;
  handleRecentSearchSelected(recent: TableRecentSearch): void;
  handleClearSearch(): void;
  handleClearRecent(): void;
  handleSearchRetry(): void;
  handlePageChange(change: { readonly page: number; readonly pageSize: number }): void;
  handleViewOptionChange(change: { readonly key: string; readonly visible: boolean }): void;
  handleViewOptionsShowAll(): void;
  handleViewOptionOrderChange(change: { readonly orderedKeys: readonly string[] }): void;
  handleDrawerOpened(): void;
  handleDrawerClosed(): void;
  handleFilterDraftChange(draft: TableFilterModel): void;
  handleFiltersApply(draft: TableFilterModel): void;
  handleFiltersReset(): void;
}

function createFixture(): ComponentFixture<ShipmentsComponent> {
  const fixture = TestBed.createComponent(ShipmentsComponent);
  fixture.detectChanges();
  return fixture;
}

function tableComponent(
  fixture: ComponentFixture<ShipmentsComponent>,
): DynamicTableComponent<Shipment> {
  return fixture.debugElement.query(By.directive(DynamicTableComponent))
    .componentInstance as DynamicTableComponent<Shipment>;
}

function searchComponent(
  fixture: ComponentFixture<ShipmentsComponent>,
): TableSearchComponent<Shipment> {
  return fixture.debugElement.query(By.directive(TableSearchComponent))
    .componentInstance as TableSearchComponent<Shipment>;
}

function viewOptionsComponent(
  fixture: ComponentFixture<ShipmentsComponent>,
): TableViewOptionsComponent {
  return fixture.debugElement.query(By.directive(TableViewOptionsComponent))
    .componentInstance as TableViewOptionsComponent;
}

function componentSignals(fixture: ComponentFixture<ShipmentsComponent>): ShipmentSignals {
  return fixture.componentInstance as unknown as ShipmentSignals;
}

function englishTranslations(): TranslationObject {
  return {
    STARLINKS: {
      DRAWER: { CLOSE: 'Close drawer' },
      TABLE: {
        MISSING_VALUE: 'Not available',
        EMPTY_TITLE: 'No data yet',
        EMPTY_DESCRIPTION: 'Data will appear here.',
        NO_RESULTS_TITLE: 'No matching results',
        NO_RESULTS_DESCRIPTION: 'Change the criteria.',
        NO_COLUMNS_TITLE: 'No columns available',
        NO_COLUMNS_DESCRIPTION: 'Choose a column.',
        ERROR_MESSAGE: 'Unable to load table data.',
        RETRY: 'Retry',
        LOADING: 'Loading table data',
        REFRESH_LOADING: 'Updating table data',
        SORT_ASCENDING: 'Sort {{column}} ascending',
        SORT_DESCENDING: 'Sort {{column}} descending',
        CLEAR_SORTING: 'Clear sorting for {{column}}',
        ACTION_LOADING: '{{action}} in progress',
        PAGINATION: {
          PREVIOUS: 'Previous',
          NEXT: 'Next',
          NAVIGATION: 'Table pagination',
          PAGE: 'Go to page {{page}}',
          CURRENT_PAGE: 'Page {{page}} of {{totalPages}}',
        },
        SEARCH: {
          SELECT_FIELD: 'Select search field',
          SEARCH_PLACEHOLDER: 'Search',
          RECENT_SEARCHES: 'Recent searches',
          CLEAR_RECENT: 'Clear recent',
          CLEAR_SEARCH: 'Clear search',
          SUGGESTIONS: 'Suggestions',
          LOADING: 'Loading suggestions',
          NO_RESULTS: 'No suggestions found',
          NO_RESULTS_DESCRIPTION: 'Try a different value.',
          ERROR: 'Unable to load suggestions',
          RETRY: 'Retry',
          SEPARATOR: '/',
          COMBOBOX_LABEL: 'Table search',
          FIELD_GROUP_LABEL: 'Search fields',
          SUGGESTIONS_LIST_LABEL: 'Search suggestions',
        },
        TOOLBAR: { LABEL: 'Table controls' },
        VIEW_OPTIONS: {
          TITLE: 'View options',
          TRIGGER: 'View options',
          COLUMNS: 'Columns',
          RESET: 'Reset',
          NON_HIDEABLE: 'Always shown',
          TABLE_CONTENT: 'Table content',
          SHOW_ALL: 'Show all',
          HIDE_COLUMN: 'Hide {{column}} column',
          SHOW_COLUMN: 'Show {{column}} column',
          REORDER_COLUMN: 'Reorder {{column}} column',
          REORDER_INSTRUCTIONS: 'Drag or use reorder controls.',
          MOVE_UP: 'Move {{column}} column up',
          MOVE_DOWN: 'Move {{column}} column down',
        },
        FILTERS: {
          TITLE: 'Filters',
          TRIGGER: 'Filters',
          RESET: 'Reset',
          APPLY: 'Apply',
          ACTIVE_FILTERS: '{{count}} active filters',
          SELECT_PLACEHOLDER: 'Select an option',
          NO_FILTERS: 'No filters',
          SERVICES: 'Services',
          PERIOD: 'Period',
          ALL: 'All',
          LAST_7_DAYS: 'Last 7 Days',
          LAST_30_DAYS: 'Last 30 Days',
          LAST_90_DAYS: 'Last 90 Days',
          DETAILS: 'More filters',
        },
      },
      SHIPMENTS: shipmentTranslations({
        title: 'Shipments',
        caption: 'Shipments table',
        freight: 'Freight forward',
        lastMile: 'Last mile',
        pickedUp: 'Picked up',
        locations: ['Riyadh', 'Makkah', 'Tabuk', 'Khobar'],
      }),
    },
  };
}

function arabicTranslations(): TranslationObject {
  return {
    STARLINKS: {
      DRAWER: { CLOSE: 'Close drawer' },
      TABLE: englishTranslationsValue('TABLE'),
      SHIPMENTS: shipmentTranslations({
        title: 'الشحنات',
        caption: 'جدول الشحنات',
        freight: 'شحن البضائع',
        lastMile: 'الميل الأخير',
        pickedUp: 'تم الاستلام',
        locations: ['الرياض', 'مكة', 'تبوك', 'الخبر'],
      }),
    },
  };
}

function shipmentTranslations(values: {
  readonly title: string;
  readonly caption: string;
  readonly freight: string;
  readonly lastMile: string;
  readonly pickedUp: string;
  readonly locations: readonly [string, string, string, string];
}): TranslationObject {
  return {
    PAGE_TITLE: values.title,
    TABLE_CAPTION: values.caption,
    TABLE_CARD: {
      TITLE: 'Recent Shipments',
      SUBTITLE: 'Track all shipments on your account',
      ADD_SHIPMENT: 'Add Shipment',
      EXPORT: 'Export',
    },
    SUMMARY: {
      LABEL: 'Shipment summary',
      IN_TRANSIT: 'In Transit',
      OUT_FOR_DELIVERY: 'Out for Delivery',
      EXCEPTION: 'Exception',
      ON_TIME_RATE: 'On-Time Rate',
      ON_TIME_TREND: 'On-time delivery rate increased',
      FULLY_DELIVERED: 'Fully Delivered',
      TOTAL_SHIPMENTS: 'Total Shipments',
    },
    COLUMNS: {
      SHIPMENT_NUMBER: 'Shipment No.',
      CUSTOMER_REFERENCE: 'Customer Ref.',
      SERVICE: 'Service',
      ROUTE: 'Origin / Destination',
      PICKUP_DATE: 'Pickup Date',
      EXPECTED_DELIVERY_DATE: 'Expected Delivery Date',
      PROGRESS: 'Progress',
      STATUS: 'Status',
      ACTIONS: 'Actions',
    },
    SERVICES: { FREIGHT_FORWARD: values.freight, LAST_MILE: values.lastMile, '3PL': '3PL' },
    LOCATIONS: {
      RIYADH: values.locations[0],
      MAKKAH: values.locations[1],
      TABUK: values.locations[2],
      KHOBAR: values.locations[3],
    },
    STATUSES: {
      PICKED_UP: values.pickedUp,
      DELIVERED: 'Delivered',
      IN_TRANSIT: 'In transit',
      EXCEPTION: 'Exception',
      OUT_FOR_DELIVERY: 'Out for delivery',
    },
    SEARCH: {
      FIELD_GROUP_TITLE: 'Shipments',
      SUGGESTED_SHIPMENTS: 'Suggested shipments',
      FIELDS: { ORIGIN: 'Origin', DESTINATION: 'Destination' },
    },
    FILTERS: {
      ORIGIN: 'Origin',
      DESTINATION: 'Destination',
      FILTERED_EMPTY_TITLE: 'No shipments match these filters',
      FILTERED_EMPTY_DESCRIPTION: 'Adjust the filters.',
    },
    ACTIONS: {
      PRINT: 'Print',
      PRINT_TOOLTIP: 'Print record',
      CONFIRM: 'Confirm',
      CONFIRM_TOOLTIP: 'Confirm record',
      CANCEL: 'Cancel',
      CANCEL_TOOLTIP: 'Cancel record',
    },
  };
}

function emptyFilters(): TableFilterModel {
  return {
    shipmentNumber: null,
    customerReference: null,
    service: null,
    origin: null,
    destination: null,
    status: [],
    period: null,
    pickupDate: null,
    expectedDeliveryDate: null,
  };
}

function englishTranslationsValue(key: 'TABLE'): TranslationObject {
  return (englishTranslations()['STARLINKS'] as TranslationObject)[key] as TranslationObject;
}
