import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { TableStatusCellComponent } from '../../../../shared/components/dynamic-table/cells/table-status-cell/table-status-cell.component';
import {
  TableStatusColumn,
  TableStatusDisplay,
  TableStatusTone,
} from '../../../../shared/components/dynamic-table/dynamic-table.types';
import { formatTableDate } from '../../../../shared/components/dynamic-table/formatters/table-date-format';
import { SideDrawerComponent } from '../../../../shared/components/side-drawer/side-drawer.component';
import { SideDrawerFooterDirective } from '../../../../shared/components/side-drawer/side-drawer-footer.directive';
import { Shipment, ShipmentLocation, ShipmentStatus } from '../../models/shipment.model';

type ShipmentMilestone = 'created' | 'picked-up' | 'in-transit' | 'out-for-delivery' | 'delivered';
type MilestoneState = 'complete' | 'current' | 'pending';
type MilestoneDetail = 'origin' | 'route' | 'destination' | null;

interface ShipmentProgressStage {
  readonly key: ShipmentMilestone;
  readonly fill: number;
  readonly tone: 'neutral' | 'warning' | 'info' | 'accent' | 'success';
}

interface ShipmentTimelineItem {
  readonly key: ShipmentMilestone;
  readonly state: MilestoneState;
  readonly timestamp: string | null;
  readonly detail: MilestoneDetail;
}

const STATUS_TONES: Readonly<Record<ShipmentStatus, TableStatusTone>> = {
  'picked-up': 'warning',
  delivered: 'success',
  'in-transit': 'info',
  exception: 'danger',
  'out-for-delivery': 'accent',
};

const MILESTONES = Object.freeze([
  Object.freeze({ key: 'created', threshold: 0, detail: null }),
  Object.freeze({ key: 'picked-up', threshold: 1, detail: 'origin' }),
  Object.freeze({ key: 'in-transit', threshold: 30, detail: 'route' }),
  Object.freeze({ key: 'out-for-delivery', threshold: 70, detail: 'destination' }),
  Object.freeze({ key: 'delivered', threshold: 100, detail: 'destination' }),
] as const);

@Component({
  selector: 'app-shipment-details-drawer',
  imports: [
    SideDrawerComponent,
    SideDrawerFooterDirective,
    TableStatusCellComponent,
    TranslatePipe,
  ],
  templateUrl: './shipment-details-drawer.component.html',
  styleUrl: './shipment-details-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ShipmentDetailsDrawerComponent {
  private readonly translate = inject(TranslateService);

  readonly shipment = input.required<Shipment>();
  readonly open = input(false);

  readonly closed = output<void>();
  readonly exportRequested = output<Shipment>();
  readonly raiseTicketRequested = output<Shipment>();

  protected readonly drawerTitle = computed(() => ({
    key: 'STARLINKS.SHIPMENTS.DETAILS.ACCESSIBLE_TITLE',
    params: { shipmentNumber: this.shipment().shipmentNumber },
  }));

  protected readonly progressStages = computed<readonly ShipmentProgressStage[]>(() => {
    const progress = this.shipment().progress;
    return Object.freeze([
      this.progressStage('created', progress >= 0 ? 100 : 0, 'neutral'),
      this.progressStage('picked-up', segmentFill(progress, 1, 30), 'warning'),
      this.progressStage('in-transit', segmentFill(progress, 30, 70), 'info'),
      this.progressStage('out-for-delivery', segmentFill(progress, 70, 100), 'accent'),
      this.progressStage('delivered', progress >= 100 ? 100 : 0, 'success'),
    ]);
  });

  protected readonly timeline = computed<readonly ShipmentTimelineItem[]>(() => {
    const shipment = this.shipment();
    const achievedIndex =
      shipment.status === 'delivered'
        ? MILESTONES.length
        : achievedMilestoneIndex(shipment.progress);
    const ascending = MILESTONES.map((milestone, index) => {
      const state: MilestoneState =
        shipment.status === 'delivered' || index < achievedIndex
          ? 'complete'
          : index === achievedIndex
            ? 'current'
            : 'pending';
      return Object.freeze({
        key: milestone.key,
        state,
        timestamp: state === 'pending' ? null : milestoneTimestamp(shipment, milestone.key),
        detail: milestone.detail,
      });
    });
    return Object.freeze(ascending.reverse());
  });

  protected readonly statusColumn: TableStatusColumn<Shipment> = Object.freeze({
    key: 'status',
    label: { key: 'STARLINKS.SHIPMENTS.COLUMNS.STATUS' },
    type: 'status',
    field: 'status',
    resolveStatus: (row: Shipment) => this.statusDisplay(row),
  });

  protected requestClose(): void {
    this.closed.emit();
  }

  protected requestExport(): void {
    this.exportRequested.emit(this.shipment());
  }

  protected requestRaiseTicket(): void {
    this.raiseTicketRequested.emit(this.shipment());
  }

  protected statusDisplay(shipment: Shipment): TableStatusDisplay {
    return {
      label: { key: `STARLINKS.SHIPMENTS.STATUSES.${translationSegment(shipment.status)}` },
      tone: STATUS_TONES[shipment.status],
    };
  }

  protected locationKey(location: ShipmentLocation): string {
    return `STARLINKS.SHIPMENTS.LOCATIONS.${location.toUpperCase()}`;
  }

  protected serviceLabelKey(): string {
    return `STARLINKS.SHIPMENTS.SERVICES.${translationSegment(this.shipment().service)}`;
  }

  protected milestoneLabelKey(milestone: ShipmentMilestone): string {
    return `STARLINKS.SHIPMENTS.DETAILS.MILESTONES.${translationSegment(milestone)}`;
  }

  protected formatDate(value: string): string {
    return (
      formatTableDate(value, this.translate.currentLang() ?? 'en', {
        kind: 'pattern',
        pattern: 'd/M/yyyy',
        timeZone: 'UTC',
      }) ?? '—'
    );
  }

  protected formatTimestamp(value: string): string {
    const locale = this.translate.currentLang() ?? 'en';
    const date = new Date(value);
    const day = new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(date);
    const time = new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'UTC',
    }).format(date);
    return `${day} · ${time}`;
  }

  private progressStage(
    key: ShipmentMilestone,
    fill: number,
    tone: ShipmentProgressStage['tone'],
  ): ShipmentProgressStage {
    return Object.freeze({ key, fill, tone });
  }
}

function segmentFill(progress: number, start: number, end: number): number {
  return Math.min(100, Math.max(0, ((progress - start) / (end - start)) * 100));
}

function achievedMilestoneIndex(progress: number): number {
  let achieved = 0;
  MILESTONES.forEach((milestone, index) => {
    if (progress >= milestone.threshold) {
      achieved = index;
    }
  });
  return achieved;
}

function milestoneTimestamp(shipment: Shipment, milestone: ShipmentMilestone): string {
  switch (milestone) {
    case 'created':
      return offsetDate(shipment.pickupDate, -1, 16, 20);
    case 'picked-up':
      return offsetDate(shipment.pickupDate, 0, 9, 15);
    case 'in-transit':
      return offsetDate(shipment.pickupDate, 1, 14, 0);
    case 'out-for-delivery':
      return offsetDate(shipment.expectedDeliveryDate, -1, 7, 30);
    case 'delivered':
      return offsetDate(shipment.expectedDeliveryDate, 0, 11, 4);
  }
}

function offsetDate(value: string, days: number, hours: number, minutes: number): string {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(hours, minutes, 0, 0);
  return date.toISOString();
}

function translationSegment(value: string): string {
  return value.replaceAll('-', '_').toUpperCase();
}
