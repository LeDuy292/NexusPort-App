import { getNodeCoreBaseUrl } from "../../../config/api";
import { apiRequest } from "../../../lib/apiClient";

export interface YardNode {
  id: string; label: string; x: number; y: number; restricted?: boolean;
  gateCode?: string; blockCode?: string; slotId?: string; location?: string;
}
export interface YardEdge {
  id: string; from: string; to: string; distanceMeters: number; travelSeconds: number;
  restricted?: boolean; bidirectional?: boolean; congestion?: number; instruction?: string;
}
export interface YardLayout {
  drawingVersion?: string;
  blocks: Array<{ code: string; label: string; x: number; y: number; width: number; height: number; bays: number; rows: number; tiers: number }>;
  slots: Array<{ id: string; block: string; bay: number; row: number; tier: number; status: string }>;
}
export interface YardMap {
  version: string; nodes: YardNode[]; edges: YardEdge[]; layout?: YardLayout; referenceLayout?: ReferenceYardLayout;
}
export interface ReferenceYardLayout {
  version: string; status: string; width: number; height: number;
  zones: Array<{ code: string; label: string; maxContainerRows: number | null }>;
  gates: Array<{ code: string; label: string; direction: string; x: number; y: number }>;
  roads: Array<{ id: string; points: number[][]; direction: string }>;
  facilities: Array<{ code: string; label: string; x: number; y: number; width: number; height: number }>;
  areas: Array<{ code: string; zone: string; bay: number; rows: number[]; x: number; y: number; width: number; height: number; orientation: string; note: string; sourceHighlight: boolean }>;
}
export interface SmartRoute {
  containerId: string; containerNumber: string; bookingId: string; bookingCode?: string;
  bookingType?: string; driverId?: string; driverName?: string; truckPlate?: string;
  gateTransactionId: string; gateCode: string; gateStatus: string;
  target?: { type: "slot" | "area"; location: string; slotId: string | null; block: string | null; zone: string | null; bay: number | null; row: number | null; tier: number | null; source: string } | null;
  operation?: { id: string; taskCode: string | null; type: string | null; status: string | null } | null;
  navigation?: {
    status: "available" | "unavailable" | "pending_destination"; reasonCode: string | null; message: string;
    revision: string; generatedAt: string; refreshAfterSeconds: number; mapVersion: string | null;
    origin: YardNode | null; destinationNode: YardNode | null; waypoints: YardNode[]; segments: YardEdge[];
    directions: string[]; distanceMeters: number | null; estimatedSeconds: number | null; rerouted: boolean;
    map: YardMap | null;
  };
  journey?: {
    phase: "to_yard" | "at_yard" | "ready_for_gate_out" | "exited";
    gateInAt: string | null; arrivedAt: string | null; containerConfirmedAt: string | null;
    gateOutAt: string | null; currentNodeId: string | null; canArrive: boolean;
    canConfirmContainer: boolean; exitGateCode: string | null;
  };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await apiRequest<{ data: T }>(`/api/v1${path}`, { ...options, baseUrl: await getNodeCoreBaseUrl() });
  return response.data;
}

export function listSmartRoutes(): Promise<SmartRoute[]> {
  return request("/drivers/me/routes");
}

export function getDriverYardMap(): Promise<{ map: YardMap | null; errorCode?: string; referenceLayout?: ReferenceYardLayout }> {
  return request('/drivers/me/yard-map');
}

export function getSmartRoute(containerId: string, bookingId: string): Promise<SmartRoute> {
  const query = new URLSearchParams({ bookingId });
  return request(`/drivers/me/routes/${encodeURIComponent(containerId)}?${query}`);
}

export function arriveAtDestination(route: SmartRoute): Promise<SmartRoute> {
  return request(`/drivers/me/routes/${encodeURIComponent(route.containerId)}/progress`, {
    method: "POST",
    body: JSON.stringify({ bookingId: route.bookingId, action: "arrive", currentNodeId: route.navigation?.destinationNode?.id }),
  });
}

export function confirmYardContainer(route: SmartRoute, condition: "OK" | "DAMAGED" | "ISSUE", notes?: string): Promise<SmartRoute> {
  return request(`/drivers/me/routes/${encodeURIComponent(route.containerId)}/confirm-container`, {
    method: "POST", body: JSON.stringify({ bookingId: route.bookingId, condition, ...(notes?.trim() ? { notes: notes.trim() } : {}) }),
  });
}

export function routeIdentity(route: Pick<SmartRoute, "bookingId" | "containerId">): string {
  return `${route.bookingId}:${route.containerId}`;
}

// Always retain the booking scope: a container can appear in several gate visits.
export function selectSmartRoute(routes: SmartRoute[], selection: { bookingId?: string; containerId?: string; containerNumber?: string }): SmartRoute | undefined {
  return routes.find(route => (!selection.bookingId || route.bookingId === selection.bookingId)
    && (!selection.containerId || route.containerId === selection.containerId)
    && (!selection.containerNumber || route.containerNumber === selection.containerNumber));
}
