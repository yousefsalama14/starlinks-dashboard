import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';

import { TableActionEvent, TableActionVariant, TableRowAction } from '../../dynamic-table.types';
import { TableActionsCellComponent } from './table-actions-cell.component';

interface ActionRow {
  readonly id: string;
  readonly locked: boolean;
  readonly pending: boolean;
  readonly visible: boolean;
}

const ROW: ActionRow = Object.freeze({
  id: 'record-1',
  locked: false,
  pending: false,
  visible: true,
});

const BASE_ACTION: TableRowAction<ActionRow> = Object.freeze({
  id: 'edit',
  label: { key: 'TEST.EDIT' },
  icon: 'edit-2',
});

describe('TableActionsCellComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService({ fallbackLang: 'en', lang: 'en' })],
    });
    TestBed.inject(TranslateService).setTranslation('en', {
      STARLINKS: { TABLE: { ACTION_LOADING: '{{action}} in progress' } },
      TEST: {
        EDIT: 'Edit record',
        REMOVE: 'Remove record',
        CUSTOM_LABEL: 'Modify {{id}}',
        TOOLTIP: 'Edit this record',
      },
    });
  });

  it('creates and renders one visible action by default', () => {
    const fixture = createFixture();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    expect(fixture.componentInstance).toBeTruthy();
    expect(button).toBeTruthy();
    expect(button.dataset['actionId']).toBe('edit');
    expect(button.disabled).toBe(false);
  });

  it('renders multiple actions once in configured order', () => {
    const actions: readonly TableRowAction<ActionRow>[] = [
      BASE_ACTION,
      { id: 'remove', label: { key: 'TEST.REMOVE' }, icon: 'trash' },
    ];
    const fixture = createFixture({ actions });
    const ids = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
    ).map((button) => button.dataset['actionId']);

    expect(ids).toEqual(['edit', 'remove']);
  });

  it('removes hidden actions from the DOM without reserving focusable content', () => {
    const actions: readonly TableRowAction<ActionRow>[] = [
      { ...BASE_ACTION, visible: () => false },
      { id: 'remove', label: { key: 'TEST.REMOVE' }, icon: 'trash' },
    ];
    const fixture = createFixture({ actions });

    expect(fixture.nativeElement.querySelector('[data-action-id="edit"]')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('button')).toHaveLength(1);
  });

  it('disables actions from either the row callback or parent table state', () => {
    const action = { ...BASE_ACTION, disabled: (row: ActionRow) => row.locked };
    let fixture = createFixture({ actions: [action], row: { ...ROW, locked: true } });
    expect((fixture.nativeElement.querySelector('button') as HTMLButtonElement).disabled).toBe(
      true,
    );

    fixture = createFixture({ actions: [BASE_ACTION], disabled: true });
    expect((fixture.nativeElement.querySelector('button') as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it('keeps loading actions visible, disabled, and accessibly named', () => {
    const action = { ...BASE_ACTION, loading: (row: ActionRow) => row.pending };
    const fixture = createFixture({ actions: [action], row: { ...ROW, pending: true } });
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.getAttribute('aria-label')).toBe('Edit record in progress');
    expect(button.querySelector('.table-actions-cell__spinner')).toBeTruthy();
    expect(button.querySelector('[role="status"]')).toBeNull();
  });

  it('does not emit from disabled or loading actions', () => {
    const disabledFixture = createFixture({
      actions: [{ ...BASE_ACTION, disabled: () => true }],
    });
    const disabledEvents = collectEvents(disabledFixture);
    (disabledFixture.nativeElement.querySelector('button') as HTMLButtonElement).click();

    const loadingFixture = createFixture({
      actions: [{ ...BASE_ACTION, loading: () => true }],
    });
    const loadingEvents = collectEvents(loadingFixture);
    (loadingFixture.nativeElement.querySelector('button') as HTMLButtonElement).click();

    expect(disabledEvents).toEqual([]);
    expect(loadingEvents).toEqual([]);
  });

  it('emits exactly once with original references, row identity, and row index', () => {
    const fixture = createFixture();
    const events = collectEvents(fixture);
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();

    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({
      action: BASE_ACTION,
      row: ROW,
      rowId: 'validated-record-id',
      rowIndex: 4,
    });
    expect(events[0].action).toBe(BASE_ACTION);
    expect(events[0].row).toBe(ROW);
  });

  it('stops enabled action clicks from propagating to ancestors', () => {
    const fixture = createFixture();
    const container = fixture.nativeElement.querySelector('.table-actions-cell') as HTMLElement;
    let ancestorClicks = 0;
    container.addEventListener('click', () => (ancestorClicks += 1));

    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();

    expect(ancestorClicks).toBe(0);
  });

  it('uses accessibleLabel when provided and otherwise translates the action label', () => {
    const customFixture = createFixture({
      actions: [
        {
          ...BASE_ACTION,
          accessibleLabel: (row) => ({ key: 'TEST.CUSTOM_LABEL', params: { id: row.id } }),
        },
      ],
    });
    const fallbackFixture = createFixture();

    expect(customFixture.nativeElement.querySelector('button').getAttribute('aria-label')).toBe(
      'Modify record-1',
    );
    expect(fallbackFixture.nativeElement.querySelector('button').getAttribute('aria-label')).toBe(
      'Edit record',
    );
  });

  it('renders translated tooltips only when configured', () => {
    const tooltipFixture = createFixture({
      actions: [{ ...BASE_ACTION, tooltip: { key: 'TEST.TOOLTIP' } }],
    });
    const plainFixture = createFixture();

    expect(tooltipFixture.nativeElement.querySelector('button').getAttribute('title')).toBe(
      'Edit this record',
    );
    expect(plainFixture.nativeElement.querySelector('button').getAttribute('title')).toBeNull();
  });

  it.each<TableActionVariant>(['default', 'primary', 'success', 'danger'])(
    'applies the semantic %s variant',
    (variant) => {
      const fixture = createFixture({ actions: [{ ...BASE_ACTION, variant }] });
      const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

      expect(button.dataset['variant']).toBe(variant);
      expect(button.classList).toContain(`table-actions-cell__button--${variant}`);
    },
  );

  it('uses the Iconsax element for configured names and remains accessible for unknown names', () => {
    const fixture = createFixture({ actions: [{ ...BASE_ACTION, icon: 'unknown-icon-name' }] });
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    const icon = button.querySelector('iconsax-icon');

    expect(icon?.getAttribute('name')).toBe('unknown-icon-name');
    expect(icon?.getAttribute('type')).toBe('linear');
    expect(icon?.getAttribute('size')).toBe('16');
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
    expect(button.getAttribute('aria-label')).toBe('Edit record');
  });

  it('omits empty icons without removing the accessible button name', () => {
    const fixture = createFixture({ actions: [{ ...BASE_ACTION, icon: '   ' }] });
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    expect(button.querySelector('iconsax-icon')).toBeNull();
    expect(button.getAttribute('aria-label')).toBe('Edit record');
  });

  it('uses native keyboard-compatible buttons', () => {
    const fixture = createFixture();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    expect(button.tagName).toBe('BUTTON');
    expect(button.type).toBe('button');
    expect(button.tabIndex).toBe(0);
  });

  it('keeps configured order in RTL without mutating or reversing actions', () => {
    document.documentElement.dir = 'rtl';
    const actions: readonly TableRowAction<ActionRow>[] = Object.freeze([
      BASE_ACTION,
      Object.freeze({ id: 'remove', label: { key: 'TEST.REMOVE' }, icon: 'trash' }),
    ]);
    const fixture = createFixture({ actions });
    const ids = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
    ).map((button) => button.dataset['actionId']);

    expect(ids).toEqual(['edit', 'remove']);
    expect(fixture.nativeElement.querySelector('.table-actions-cell')).toBeTruthy();
    expect(fixture.componentInstance.actions()).toBe(actions);
    document.documentElement.dir = 'ltr';
  });

  it('does not mutate immutable action or row inputs', () => {
    const actions = Object.freeze([BASE_ACTION]);
    const fixture = createFixture({ actions });

    expect(fixture.componentInstance.actions()).toBe(actions);
    expect(fixture.componentInstance.row()).toBe(ROW);
    expect(Object.isFrozen(actions)).toBe(true);
    expect(Object.isFrozen(BASE_ACTION)).toBe(true);
    expect(Object.isFrozen(ROW)).toBe(true);
  });

  it('keeps the tracked button and focus stable after an immutable row update', () => {
    const fixture = createFixture();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.focus();

    fixture.componentRef.setInput('row', { ...ROW });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('button')).toBe(button);
    expect(document.activeElement).toBe(button);
  });

  it('renders an empty non-interactive container for empty or fully hidden actions', () => {
    let fixture = createFixture({ actions: [] });
    expect(fixture.nativeElement.querySelector('.table-actions-cell')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button')).toBeNull();

    fixture = createFixture({ actions: [{ ...BASE_ACTION, visible: () => false }] });
    expect(fixture.nativeElement.querySelector('.table-actions-cell')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
    expect(fixture.nativeElement.textContent?.trim()).toBe('');
  });

  it('evaluates each application callback at most once per resolution', () => {
    const calls = { visible: 0, disabled: 0, loading: 0, accessibleLabel: 0 };
    createFixture({
      actions: [
        {
          ...BASE_ACTION,
          visible: () => (++calls.visible, true),
          disabled: () => (++calls.disabled, false),
          loading: () => (++calls.loading, false),
          accessibleLabel: () => (++calls.accessibleLabel, { key: 'TEST.EDIT' }),
        },
      ],
    });

    expect(calls).toEqual({ visible: 1, disabled: 1, loading: 1, accessibleLabel: 1 });
  });

  it.each(['visible', 'disabled', 'loading', 'accessibleLabel'] as const)(
    'allows %s callback errors to surface',
    (callback) => {
      const failure = () => {
        throw new Error(`${callback} callback failed`);
      };
      const action: TableRowAction<ActionRow> = {
        ...BASE_ACTION,
        [callback]: failure,
      };

      expect(() => createFixture({ actions: [action] })).toThrowError(
        new RegExp(`${callback} callback failed`),
      );
    },
  );

  it.each(['', '   '])('rejects invalid action ID %j before rendering', (id) => {
    expect(() => createFixture({ actions: [{ ...BASE_ACTION, id }] })).toThrowError(
      /Invalid action ID at action index 0/,
    );
  });

  it('rejects duplicate IDs even when one duplicate would be hidden', () => {
    expect(() =>
      createFixture({
        actions: [BASE_ACTION, { ...BASE_ACTION, visible: () => false }],
      }),
    ).toThrowError(/Duplicate action ID "edit" at action index 1/);
  });
});

interface FixtureOptions {
  readonly actions?: readonly TableRowAction<ActionRow>[];
  readonly row?: ActionRow;
  readonly disabled?: boolean;
}

function createFixture(
  options: FixtureOptions = {},
): ComponentFixture<TableActionsCellComponent<ActionRow>> {
  const fixture = TestBed.createComponent(TableActionsCellComponent) as ComponentFixture<
    TableActionsCellComponent<ActionRow>
  >;
  fixture.componentRef.setInput('actions', options.actions ?? [BASE_ACTION]);
  fixture.componentRef.setInput('row', options.row ?? ROW);
  fixture.componentRef.setInput('rowId', 'validated-record-id');
  fixture.componentRef.setInput('rowIndex', 4);
  fixture.componentRef.setInput('disabled', options.disabled ?? false);
  fixture.detectChanges();
  return fixture;
}

function collectEvents(
  fixture: ComponentFixture<TableActionsCellComponent<ActionRow>>,
): TableActionEvent<ActionRow>[] {
  const events: TableActionEvent<ActionRow>[] = [];
  fixture.componentInstance.actionTriggered.subscribe((event) => events.push(event));
  return events;
}
