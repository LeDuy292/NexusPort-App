/**
 * Trip Service – kết nối API Transport Trip
 * Base URL: cấu hình qua AsyncStorage key "api_base_url"
 * Fallback:  http://localhost:3000
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const DEFAULT_BASE = "http://localhost:3001";

async function getHeaders() {
  const userRaw = await AsyncStorage.getItem("user");
  const token = userRaw ? JSON.parse(userRaw).token : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function getBase(): Promise<string> {
  const base = await AsyncStorage.getItem("api_base_url");
  return (base || DEFAULT_BASE).replace(/\/$/, "");
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const [base, headers] = await Promise.all([getBase(), getHeaders()]);
  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string> || {}) },
  });
  const json = await res.json();
  if (!res.ok) {
    const err = new Error(json.message || `HTTP ${res.status}`);
    (err as any).statusCode = res.status;
    throw err;
  }
  return json;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type TripStatus =
  | "Assigned"
  | "Acknowledged"
  | "Vehicle Picked Up"
  | "Container Picked Up"
  | "Gate In"
  | "In Transit"
  | "Arrived at Yard"
  | "Container Delivered"
  | "Gate Out Completed"
  | "Vehicle Returned"
  | "Completed"
  | "Cancelled";

export interface TripTimeline {
  acknowledged?: string;
  vehiclePickedUp?: string;
  containerPickedUp?: string;
  gateIn?: string;
  inTransit?: string;
  arrivedAtYard?: string;
  containerDelivered?: string;
  gateOut?: string;
  vehicleReturned?: string;
  completed?: string;
}

export interface Trip {
  id: string;
  tripCode: string;
  orderCode?: string;
  driverId: string;
  bookingId?: string;
  bookingCode?: string;
  bookingType?: string;
  truckPlate?: string;
  truckId?: string;
  containerNo?: string;
  containerType?: string;
  cargoType?: string;
  gateInCode?: string;
  gateOutCode?: string;
  yardBlock?: string;
  yardSlot?: string;
  yardZone?: string;
  yardInstructions?: string;
  yardName?: string;
  yardAddress?: string;
  sealNo?: string;
  containerCondition?: string;
  recipientName?: string;
  status: TripStatus;
  statusGroup?: "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "OTHER";
  nextStep?: TripStatus | null;
  timeline: TripTimeline;
  mapping?: {
    driver?: { id?: string };
    vehicle?: { truckPlate?: string; truckId?: string };
    container?: { containerNo?: string; containerType?: string; cargoType?: string; sealNo?: string; condition?: string };
    booking?: { bookingId?: string; bookingCode?: string; bookingType?: string };
    yard?: { name?: string; address?: string; block?: string; slot?: string; zone?: string; gateInCode?: string; gateOutCode?: string; instructions?: string; coordinates?: { lat: number; lng: number }; mapUrl?: string };
    schedule?: { appointmentStart?: string; appointmentEnd?: string };
  };
  appointmentStart?: string;
  appointmentEnd?: string;
  note?: string;
  assignedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TripHistory {
  id: string;
  fromStatus?: string;
  toStatus: string;
  changedBy?: string;
  note?: string;
  changedAt: string;
}

export interface TripDetail extends Trip {
  history: TripHistory[];
}

export interface TripsPage {
  trips: Trip[];
  orders?: Trip[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DeliveryData {
  sealNo?: string;
  containerCondition?: string;
  recipientName?: string;
  note?: string;
}

// ── API functions ─────────────────────────────────────────────────────────────

export async function getMyTrips(
  params: { status?: string; page?: number; limit?: number } = {}
): Promise<TripsPage> {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  const query = qs.toString() ? `?${qs}` : "";
  const res = await apiFetch(`/api/driver/trips${query}`);
  return res.data;
}

export async function getTransportOrders(
  params: { status?: string; page?: number; limit?: number } = {}
): Promise<TripsPage> {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  const query = qs.toString() ? `?${qs}` : "";
  try {
    const res = await apiFetch(`/api/driver/transport-orders${query}`);
    return res.data;
  } catch {
    return getMyTrips(params);
  }
}

export async function getTripById(id: string): Promise<TripDetail> {
  const res = await apiFetch(`/api/driver/trips/${id}`);
  return res.data.trip || res.data.order;
}

export async function getTransportOrderDetail(id: string): Promise<TripDetail> {
  try {
    const res = await apiFetch(`/api/driver/transport-orders/${id}`);
    return res.data.order || res.data.trip;
  } catch {
    return getTripById(id);
  }
}

export async function acknowledgeTrip(id: string): Promise<Trip> {
  const res = await apiFetch(`/api/driver/trips/${id}/acknowledge`, { method: "PATCH", body: JSON.stringify({}) });
  return res.data.trip;
}

export async function pickupVehicle(id: string, note?: string): Promise<Trip> {
  const res = await apiFetch(`/api/driver/trips/${id}/pickup-vehicle`, { method: "PATCH", body: JSON.stringify({ note }) });
  return res.data.trip;
}

export async function pickupContainer(id: string, note?: string): Promise<Trip> {
  const res = await apiFetch(`/api/driver/trips/${id}/pickup-container`, { method: "PATCH", body: JSON.stringify({ note }) });
  return res.data.trip;
}

export async function gateIn(id: string, note?: string): Promise<Trip> {
  const res = await apiFetch(`/api/driver/trips/${id}/gate-in`, { method: "PATCH", body: JSON.stringify({ note }) });
  return res.data.trip;
}

export async function arriveAtYard(id: string, note?: string): Promise<Trip> {
  const res = await apiFetch(`/api/driver/trips/${id}/arrive-yard`, { method: "PATCH", body: JSON.stringify({ note }) });
  return res.data.trip;
}

export async function deliverContainer(id: string, data: DeliveryData): Promise<Trip> {
  const res = await apiFetch(`/api/driver/trips/${id}/deliver-container`, { method: "PATCH", body: JSON.stringify(data) });
  return res.data.trip;
}

export async function gateOut(id: string, note?: string): Promise<Trip> {
  const res = await apiFetch(`/api/driver/trips/${id}/gate-out`, { method: "PATCH", body: JSON.stringify({ note }) });
  return res.data.trip;
}

export async function returnVehicle(id: string, note?: string): Promise<Trip> {
  const res = await apiFetch(`/api/driver/trips/${id}/return-vehicle`, { method: "PATCH", body: JSON.stringify({ note }) });
  return res.data.trip;
}

export interface YardNavigationData {
  tripId: string;
  tripCode: string;
  status: TripStatus;
  canNavigate: boolean;
  isNavigable: boolean;
  navigationBlockReason?: string | null;
  isYardValid: boolean;
  validationMessage?: string | null;
  yard: {
    name: string;
    address: string;
    block?: string | null;
    slot?: string | null;
    zone?: string | null;
    gateInCode?: string | null;
    gateOutCode?: string | null;
    instructions?: string | null;
    coordinates: {
      lat: number;
      lng: number;
    };
    mapUrl: string;
  };
  container: {
    containerNo?: string;
    containerType?: string;
    cargoType?: string;
    sealNo?: string;
  };
  vehicle: {
    truckPlate?: string;
  };
}

export async function getYardNavigation(id: string): Promise<YardNavigationData> {
  const res = await apiFetch(`/api/driver/trips/${id}/yard-navigation`);
  return res.data;
}

