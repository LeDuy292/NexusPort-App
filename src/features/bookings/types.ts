export interface BookingContainer {
  id: string;
  containerNo: string;
  containerType: string | null;
  cargoType: string | null;
  grossWeightKg: number | null;
  loadStatus: string | null;
  sealNumber: string | null;
  customerName: string | null;
}

export interface DriverBooking {
  id: string;
  bookingCode: string;
  bookingType: string;
  status: string;
  driverId: string;
  driverName: string;
  carrierName: string;
  truckPlate: string | null;
  appointmentStart: string;
  appointmentEnd: string;
  approvedAt: string | null;
  rejectedReason: string | null;
  description: string | null;
  createdAt: string;
  gateType: string | null;
  containers: BookingContainer[];
  dispatch: BookingDispatch | null;
  gateEntryOrder?: { id: string; status: "pending_ack" | "active" | "expired" | "revoked" | "consumed"; validFrom: string; validUntil: string; vehiclePlate: string } | null;
  coordination: { isLate: boolean; canArrive: boolean; canCall: boolean; canAcknowledge: boolean; isHeld: boolean };
}

export interface BookingDispatch {
  status: "arrived" | "ready" | "called" | "acknowledged" | "withdrawn";
  action: string;
  arrivedAt: string;
  readyAt: string | null;
  calledAt: string | null;
  callExpiresAt: string | null;
  acknowledgedAt: string | null;
  holdUntil: string | null;
  message: string | null;
  version: number;
  updatedAt: string;
}

export interface BookingNotification {
  id: string;
  bookingId: string;
  bookingCode: string;
  kind: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface BookingFeed {
  profile: { id: string; fullName: string; licenseNumber: string; carrierName: string } | null;
  bookings: DriverBooking[];
  notifications: BookingNotification[];
  unreadCount: number;
  serverTime: string;
}
