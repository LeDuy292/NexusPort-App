import type { DriverBooking } from "../bookings/types";
import type { TripDetail, Trip } from "./services/tripService";

/**
 * Luồng một chuyến vận chuyển khớp với lệnh điều phối xe bên điều độ:
 *   Chuẩn bị (tài xế) → Vào cổng (báo đến · điều độ gọi · Gate In) → Trong cảng (bãi) → Ra cảng (Gate Out · trả xe).
 */

export const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  Assigned: { label: "Chờ bạn xác nhận", color: "#0369a1", icon: "clipboard-check-outline" },
  Acknowledged: { label: "Đã nhận chuyến", color: "#7c3aed", icon: "hand-okay" },
  "Vehicle Picked Up": { label: "Đã lấy xe", color: "#a16207", icon: "truck-outline" },
  "Container Picked Up": { label: "Đã lấy container", color: "#a16207", icon: "package-variant" },
  "Gate In": { label: "Đã qua cổng vào", color: "#ff682c", icon: "boom-gate-up-outline" },
  "In Transit": { label: "Đang di chuyển trong cảng", color: "#ff682c", icon: "truck-fast" },
  "Arrived at Yard": { label: "Đã đến bãi", color: "#15803d", icon: "map-marker-check" },
  "Container Delivered": { label: "Đã giao nhận container", color: "#15803d", icon: "package-variant-closed-check" },
  "Gate Out Completed": { label: "Đã qua cổng ra", color: "#15803d", icon: "boom-gate-outline" },
  "Vehicle Returned": { label: "Đã trả xe", color: "#15803d", icon: "truck-check-outline" },
  Completed: { label: "Hoàn thành", color: "#15803d", icon: "check-circle" },
  Cancelled: { label: "Đã hủy", color: "#b91c1c", icon: "close-circle" },
};

export const STATUS_ORDER: Record<string, number> = {
  Assigned: 0, Acknowledged: 1, "Vehicle Picked Up": 2, "Container Picked Up": 3,
  "Gate In": 4, "In Transit": 5, "Arrived at Yard": 6, "Container Delivered": 7,
  "Gate Out Completed": 8, "Vehicle Returned": 9, Completed: 10,
};

export type FlowStepState = "done" | "current" | "todo";
export interface FlowStep {
  key: string;
  label: string;
  actor: string;
  state: FlowStepState;
  time?: string | null;
  hint?: string;
}
export interface FlowPhase { title: string; steps: FlowStep[] }

const time = (iso?: string | null) => (iso ? new Date(iso).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "");

type TripLike = Pick<Trip, "status" | "bookingType"> & Partial<Pick<TripDetail, "timeline">>;

export function buildTripFlow(trip: TripLike, booking?: DriverBooking | null): { phases: FlowPhase[]; current: FlowStep | null } {
  const order = STATUS_ORDER[trip.status] ?? -1;
  const dispatch = booking?.dispatch && booking.dispatch.status !== "withdrawn" ? booking.dispatch : null;
  const entry = booking?.gateEntryOrder;
  const gateOpenedByDispatch = dispatch?.status === "acknowledged" || dispatch?.action === "gate_admitted";
  const isPickup = String(trip.bookingType || "").toLowerCase() === "pickup";
  const t = trip.timeline || ({} as NonNullable<TripLike["timeline"]>);

  const doneFlags: Record<string, boolean> = {
    confirm: order >= 1,
    vehicle: order >= 2,
    container: order >= 3,
    arrive: Boolean(dispatch) || order >= 4,
    call: gateOpenedByDispatch || order >= 4,
    gatein: order >= 4,
    yard: order >= 6,
    handover: order >= 7,
    gateout: order >= 8,
    finish: order >= 10,
  };
  const defs: { phase: string; key: string; label: string; actor: string; at?: string | null }[] = [
    { phase: "Chuẩn bị · Tài xế", key: "confirm", label: "Xác nhận chuyến", actor: "Tài xế", at: t.acknowledged },
    { phase: "Chuẩn bị · Tài xế", key: "vehicle", label: "Lấy xe", actor: "Tài xế", at: t.vehiclePickedUp },
    { phase: "Chuẩn bị · Tài xế", key: "container", label: isPickup ? "Chuẩn bị nhận container" : "Lấy container", actor: "Tài xế", at: t.containerPickedUp },
    { phase: "Vào cổng · Điều độ & cổng", key: "arrive", label: "Báo đã đến cổng", actor: "Tài xế", at: dispatch?.arrivedAt },
    { phase: "Vào cổng · Điều độ & cổng", key: "call", label: "Điều độ gọi vào cổng · bạn nhận lệnh", actor: "Điều độ", at: dispatch?.acknowledgedAt || entry?.issuedAt },
    { phase: "Vào cổng · Điều độ & cổng", key: "gatein", label: "Qua cổng vào (Gate In)", actor: "Cổng", at: t.gateIn },
    { phase: "Trong cảng · Nhân viên bãi", key: "yard", label: "Đến điểm giao nhận / bãi", actor: "Tài xế", at: t.arrivedAtYard },
    { phase: "Trong cảng · Nhân viên bãi", key: "handover", label: isPickup ? "Nhận container tại bãi" : "Giao container tại bãi", actor: "Nhân viên bãi", at: t.containerDelivered },
    { phase: "Ra cảng", key: "gateout", label: "Qua cổng ra (Gate Out)", actor: "Cổng", at: t.gateOut },
    { phase: "Ra cảng", key: "finish", label: "Trả xe & hoàn thành", actor: "Tài xế", at: t.completed },
  ];

  const cancelled = trip.status === "Cancelled";
  let currentKey: string | null = null;
  if (!cancelled) currentKey = defs.find((d) => !doneFlags[d.key])?.key || null;

  const hintFor = (key: string): string | undefined => {
    if (key === "confirm") return "Bấm \"Xác nhận nhận chuyến\" ở cuối màn hình.";
    if (key === "vehicle") return "Nhận xe rồi bấm xác nhận.";
    if (key === "container") return isPickup ? "Chuẩn bị giấy tờ, đến cổng cảng." : "Nhận container rồi bấm xác nhận, sau đó đi tới cổng cảng.";
    if (key === "arrive") return booking?.coordination?.canArrive ? "Đến cổng cảng rồi bấm \"Đã đến cổng & sẵn sàng\" ở thẻ Lệnh điều phối." : "Báo đã đến cổng ở thẻ Lệnh điều phối khi đến gần giờ hẹn.";
    if (key === "call") {
      if (dispatch?.status === "called") return `Điều độ đã gọi bạn. Nhận lệnh trước ${time(dispatch.callExpiresAt) || "hạn phản hồi"}.`;
      if (dispatch?.status === "ready") return "Đang chờ điều độ gọi. Bãi còn chỗ thì hệ thống tự gọi bạn.";
      return "Chờ điều độ gọi vào cổng.";
    }
    if (key === "gatein") return entry?.validUntil ? `Qua cổng trước ${time(entry.validUntil)}. Cổng ghi nhận khi xe đi qua.` : "Cổng tự ghi nhận khi xe đi qua.";
    if (key === "yard") return "Làm theo bản đồ bãi để đến đúng điểm.";
    if (key === "handover") return isPickup ? "Nhân viên bãi giao container cho bạn." : "Nhân viên bãi nhận container của bạn.";
    if (key === "gateout") return "Ra cổng ra, camera đối soát biển số.";
    if (key === "finish") return "Bấm \"Xác nhận trả xe & Hoàn thành\" ở cuối màn hình.";
    return undefined;
  };

  const phases: FlowPhase[] = [];
  for (const d of defs) {
    let phase = phases.find((p) => p.title === d.phase);
    if (!phase) { phase = { title: d.phase, steps: [] }; phases.push(phase); }
    const done = doneFlags[d.key];
    phase.steps.push({
      key: d.key, label: d.label, actor: d.actor,
      state: done ? "done" : d.key === currentKey ? "current" : "todo",
      time: done ? time(d.at) : null,
      hint: d.key === currentKey ? hintFor(d.key) : undefined,
    });
  }
  const current = phases.flatMap((p) => p.steps).find((s) => s.state === "current") || null;
  return { phases, current };
}

/** Nhãn ngắn trên thẻ chuyến: trạng thái lệnh điều phối của lịch hẹn. */
export function dispatchBadge(trip: TripLike, booking?: DriverBooking | null): { label: string; color: string } | null {
  if (!booking || ["Completed", "Cancelled"].includes(trip.status)) return null;
  const order = STATUS_ORDER[trip.status] ?? 0;
  const dispatch = booking.dispatch && booking.dispatch.status !== "withdrawn" ? booking.dispatch : null;
  if (order >= 4) return { label: "Đã vào cảng", color: "#15803d" };
  if (booking.gateEntryOrder?.status === "active" || dispatch?.action === "gate_admitted") return { label: "Được phép vào cổng", color: "#15803d" };
  if (dispatch?.status === "called") return { label: "Điều độ đang gọi bạn", color: "#c2410c" };
  if (dispatch?.status === "acknowledged") return { label: "Đã nhận lệnh gọi", color: "#0f766e" };
  if (dispatch?.status === "ready" || dispatch?.status === "arrived") return { label: "Chờ điều độ gọi", color: "#2563eb" };
  if (order < 1) return { label: "Chờ xác nhận chuyến", color: "#a16207" };
  return { label: "Chưa báo đến cổng", color: "#64748b" };
}
