import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';

import { SHIPMENTS_MOCK } from '../../data/shipments.mock';
import { Shipment } from '../../models/shipment.model';
import { ShipmentDetailsDrawerComponent } from './shipment-details-drawer.component';

describe('ShipmentDetailsDrawerComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ShipmentDetailsDrawerComponent],
      providers: [provideTranslateService({ fallbackLang: 'en', lang: 'en' })],
    });
    TestBed.inject(TranslateService).setTranslation('en', translations());
  });

  afterEach(() => {
    document.documentElement.dir = 'ltr';
    document.body.style.overflow = '';
  });

  it('reuses the accessible inset wide drawer and remains absent while controlled closed', async () => {
    const fixture = createFixture(SHIPMENTS_MOCK[0], false);
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();

    fixture.componentRef.setInput('open', true);
    await settleOpen(fixture);
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;

    expect(dialog.classList).toContain('side-drawer--inset');
    expect(dialog.classList).toContain('side-drawer--wide');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(
      fixture.nativeElement.querySelector(`#${dialog.getAttribute('aria-labelledby')}`).textContent,
    ).toContain('SLK-2025-1234');
    expect(fixture.nativeElement.querySelectorAll('.side-drawer__backdrop')).toHaveLength(1);
  });

  it('renders complete read-only information from the exact immutable shipment input', async () => {
    const shipment = SHIPMENTS_MOCK[0];
    const fixture = createFixture(shipment);
    await settleOpen(fixture);
    const text = fixture.nativeElement.textContent;

    expect(fixture.componentInstance.shipment()).toBe(shipment);
    expect(Object.isFrozen(shipment)).toBe(true);
    expect(text).toContain('SLK-2025-1234');
    expect(text).toContain('AB-5678-C');
    expect(text).toContain('Freight forward');
    expect(text).toContain('3');
    expect(text).toContain('14.2');
    expect(text).toContain('Riyadh');
    expect(text).toContain('Makkah');
    expect(text).toContain('12/11/2026');
    expect(text).toContain('19/11/2026');
    expect(fixture.nativeElement.querySelector('.table-status-cell--warning')).toBeTruthy();
  });

  it('renders accessible staged progress and deterministic current/pending status history', async () => {
    const fixture = createFixture(SHIPMENTS_MOCK[0]);
    await settleOpen(fixture);
    const progress = fixture.nativeElement.querySelector('[role="progressbar"]') as HTMLElement;
    const timeline = [
      ...fixture.nativeElement.querySelectorAll('.shipment-details__timeline-item'),
    ] as HTMLElement[];

    expect(progress.getAttribute('aria-valuenow')).toBe('14');
    expect(
      fixture.nativeElement.querySelectorAll('.shipment-details__progress-stage'),
    ).toHaveLength(5);
    expect(timeline.map((item) => item.dataset['state'])).toEqual([
      'pending',
      'pending',
      'pending',
      'current',
      'complete',
    ]);
    expect(timeline[3].textContent).toContain('Riyadh Warehouse');
    expect(timeline[0].textContent).toContain('---');
  });

  it('renders a fully delivered shipment with all milestones complete', async () => {
    const fixture = createFixture(SHIPMENTS_MOCK[1]);
    await settleOpen(fixture);
    const timeline = [
      ...fixture.nativeElement.querySelectorAll('.shipment-details__timeline-item'),
    ] as HTMLElement[];

    expect(
      fixture.nativeElement.querySelector('[role="progressbar"]').getAttribute('aria-valuenow'),
    ).toBe('100');
    expect(timeline.every((item) => item.dataset['state'] === 'complete')).toBe(true);
    expect(fixture.nativeElement.querySelector('.table-status-cell--success')).toBeTruthy();
  });

  it('emits feature intents and a single controlled close request without mutating the row', async () => {
    const shipment = SHIPMENTS_MOCK[0];
    const fixture = createFixture(shipment);
    const exports: Shipment[] = [];
    const tickets: Shipment[] = [];
    let closes = 0;
    fixture.componentInstance.exportRequested.subscribe((value) => exports.push(value));
    fixture.componentInstance.raiseTicketRequested.subscribe((value) => tickets.push(value));
    fixture.componentInstance.closed.subscribe(() => closes++);
    await settleOpen(fixture);

    (fixture.nativeElement.querySelector('.shipment-details__export') as HTMLButtonElement).click();
    (
      fixture.nativeElement.querySelector('.shipment-details__raise-ticket') as HTMLButtonElement
    ).click();
    (fixture.nativeElement.querySelector('.side-drawer__close') as HTMLButtonElement).click();

    expect(exports).toEqual([shipment]);
    expect(tickets).toEqual([shipment]);
    expect(closes).toBe(1);
    expect(fixture.componentInstance.shipment()).toBe(shipment);
  });

  it('keeps configured information order and logical layout hooks in Arabic RTL', async () => {
    document.documentElement.dir = 'rtl';
    const fixture = createFixture(SHIPMENTS_MOCK[0]);
    await settleOpen(fixture);

    expect(fixture.nativeElement.querySelector('.side-drawer--inline-end')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.shipment-details__route-grid')).toBeTruthy();
    expect(
      [
        ...fixture.nativeElement.querySelectorAll('.shipment-details__info-row dd'),
      ][0].textContent?.trim(),
    ).toBe('SLK-2025-1234');
  });

  it('uses only linear Iconsax glyphs for visible drawer controls and information labels', async () => {
    const fixture = createFixture(SHIPMENTS_MOCK[0]);
    await settleOpen(fixture);
    const icons = [...fixture.nativeElement.querySelectorAll('iconsax-icon')] as HTMLElement[];

    expect(icons.length).toBeGreaterThan(10);
    expect(icons.every((icon) => icon.getAttribute('type') === 'linear')).toBe(true);
    expect(fixture.nativeElement.querySelector('.pi')).toBeNull();
  });
});

function createFixture(
  shipment: Shipment,
  open = true,
): ComponentFixture<ShipmentDetailsDrawerComponent> {
  const fixture = TestBed.createComponent(ShipmentDetailsDrawerComponent);
  fixture.componentRef.setInput('shipment', shipment);
  fixture.componentRef.setInput('open', open);
  fixture.detectChanges();
  return fixture;
}

async function settleOpen(
  fixture: ComponentFixture<ShipmentDetailsDrawerComponent>,
): Promise<void> {
  await fixture.whenStable();
  await Promise.resolve();
  fixture.detectChanges();
}

function translations() {
  return {
    STARLINKS: {
      DRAWER: { CLOSE: 'Close drawer' },
      SHIPMENTS: {
        COLUMNS: { STATUS: 'Status' },
        SERVICES: { FREIGHT_FORWARD: 'Freight forward', LAST_MILE: 'Last mile', '3PL': '3PL' },
        LOCATIONS: { RIYADH: 'Riyadh', MAKKAH: 'Makkah', TABUK: 'Tabuk', KHOBAR: 'Khobar' },
        STATUSES: {
          PICKED_UP: 'Picked up',
          DELIVERED: 'Delivered',
          IN_TRANSIT: 'In transit',
          EXCEPTION: 'Exception',
          OUT_FOR_DELIVERY: 'Out for delivery',
        },
        DETAILS: {
          ACCESSIBLE_TITLE: 'Shipment {{shipmentNumber}} details',
          HEADER_LABEL: 'Shipment',
          EXPORT: 'Export shipment details',
          SHIPMENT_INFO: 'Shipment info',
          SHIPMENT_NUMBER: 'Shipment no.',
          STATUS: 'Status',
          CUSTOMER_REFERENCE: 'Customer ref.',
          SERVICE_TYPE: 'Service type',
          PIECES: 'Pieces',
          WEIGHT: 'Weight',
          KILOGRAM: 'kg',
          ROUTE: 'Route',
          ORIGIN: 'Origin',
          DESTINATION: 'Destination',
          WAREHOUSE: 'Warehouse',
          PICKUP_DATE: 'Pickup date',
          EXPECTED_DELIVERY_DATE: 'Expected Delivery Date',
          PROGRESS: 'Progress',
          STATUS_HISTORY: 'Status history',
          NO_EVENT: 'No event recorded',
          RAISE_TICKETS: 'Raise Tickets',
          MILESTONES: {
            CREATED: 'Created',
            PICKED_UP: 'Picked up',
            IN_TRANSIT: 'In transit',
            OUT_FOR_DELIVERY: 'Out for delivery',
            DELIVERED: 'Delivery',
          },
        },
      },
    },
  };
}
