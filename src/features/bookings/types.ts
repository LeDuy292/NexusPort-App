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
}
