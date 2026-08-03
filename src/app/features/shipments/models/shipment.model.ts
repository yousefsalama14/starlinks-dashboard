export type ShipmentStatus =
  'picked-up' | 'delivered' | 'in-transit' | 'exception' | 'out-for-delivery';

export type ShipmentService = 'freight-forward' | 'last-mile' | '3pl';

export type ShipmentLocation = 'riyadh' | 'makkah' | 'tabuk' | 'khobar';

export type ShipmentActionId = 'print' | 'confirm' | 'cancel';

export interface Shipment {
  readonly id: string;
  readonly shipmentNumber: string;
  readonly customerReference: string;
  readonly service: ShipmentService;
  readonly origin: ShipmentLocation;
  readonly destination: ShipmentLocation;
  readonly pickupDate: string;
  readonly expectedDeliveryDate: string;
  readonly progress: number;
  readonly status: ShipmentStatus;
  readonly pieces: number;
  readonly weightKg: number;
  readonly availableActions: readonly ShipmentActionId[];
  readonly hasShipmentIndicator: boolean;
}
