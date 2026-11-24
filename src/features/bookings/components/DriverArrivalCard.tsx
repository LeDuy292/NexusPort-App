import { useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { useBookings } from "../BookingProvider";
import { confirmPassedGate, updateBookingArrival } from "../bookingService";
import { bookingTime, isApproved } from "../bookingPresentation";
import type { DriverBooking } from "../types";
import { ui } from "./BookingUI";

const labels = { arrived: "Đã đến cổng · chưa sẵn sàng", ready: "Đã đến cổng · chờ điều độ gọi", called: "Điều độ đang gọi bạn", acknowledged: "Bạn đã nhận lệnh gọi", withdrawn: "Cần xác nhận lại" };

export function DriverArrivalCard({ booking, disabled = false, compact = false }: { booking: DriverBooking; disabled?: boolean; compact?: boolean }) {
  const { reload, realtimeConnected, error: feedError } = useBookings();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!isApproved(booking.status)) return null;
  const dispatch = booking.dispatch?.status === "withdrawn" ? null : booking.dispatch;
  const action = async (name: "arrive" | "ready" | "not-ready" | "acknowledge") => {
    if (busy || disabled || feedError) return;
    setBusy(true); setError(null);
    try { await updateBookingArrival(booking, name); await reload(); }
    catch (err) { setError(err instanceof Error ? err.message : "Không gửi được xác nhận."); await reload(); }
    finally { setBusy(false); }
  };
  const passedGate = async () => {
    if (busy || disabled || feedError) return;
    setBusy(true); setError(null);
    try { await confirmPassedGate(booking); await reload(); }
    catch (err) { setError(err instanceof Error ? err.message : "Không ghi nhận được. Thử lại hoặc báo nhân viên cổng."); await reload(); }
    finally { setBusy(false); }
  };
  const button = (title: string, name: Parameters<typeof action>[0], unavailable = false, secondary = false) =>
    <TouchableOpacity accessibilityRole="button" disabled={busy || disabled || !!feedError || unavailable} onPress={() => void action(name)}
      style={{ padding: 14, borderRadius: 12, backgroundColor: secondary ? "#e2e8f0" : "#c45b22", opacity: busy || disabled || feedError || unavailable ? 0.45 : 1 }}>
      <Text style={{ color: secondary ? "#334155" : "white", textAlign: "center", fontWeight: "700" }}>{title}</Text>
    </TouchableOpacity>;
  const arrivedDone = Boolean(dispatch);
  const callAcknowledged = dispatch?.status === "acknowledged" || dispatch?.action === "gate_admitted";
  const steps = [
    { title: "Báo đã đến cổng & sẵn sàng", done: arrivedDone, current: !arrivedDone },
    { title: "Nhận lệnh vào cổng từ điều độ", done: callAcknowledged, current: arrivedDone && !callAcknowledged },
  ];
  return <View style={[ui.card, { borderColor: dispatch?.status === "called" ? "#ed6026" : "#395d47" }]}>
    <View style={ui.row}>
      <Text style={[ui.title, { flex: 1 }]}>{compact ? "Lệnh điều phối xe" : "Đến cổng & chờ điều độ gọi"}</Text>
      <Text style={{ color: realtimeConnected ? "#15803d" : "#a16207", fontSize: 11 }}>{realtimeConnected ? "● Trực tuyến" : "Đang nối lại"}</Text>
    </View>
    {!compact && steps.map((step) => <View key={step.title} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Text style={{ fontSize: 15, color: step.done ? "#15803d" : step.current ? "#c45b22" : "#94a3b8" }}>{step.done ? "✓" : step.current ? "●" : "○"}</Text>
      <Text style={{ flex: 1, fontSize: 13, fontWeight: step.current ? "700" : "500", color: step.done ? "#15803d" : step.current ? "#172b3a" : "#64748b" }}>{step.title}</Text>
    </View>)}
    {dispatch && <Text style={ui.text}>{dispatch.action === "gate_admitted" ? "Đã được cấp lệnh tại cổng" : labels[dispatch.status]}</Text>}
    {dispatch && <Text style={ui.muted}>Đến lúc: {bookingTime(dispatch.arrivedAt)}{booking.coordination?.isLate ? " · Đến muộn" : ""}</Text>}
    {booking.dispatch?.status === "withdrawn" && <Text style={{ color: "#a16207" }}>Lịch hoặc phân công đã thay đổi. Kiểm tra lại trước khi xác nhận đến.</Text>}
    {dispatch?.message && <Text style={ui.text}>{dispatch.message}</Text>}
    {booking.gateEntryOrder?.status === "active" && <Text style={{ color: "#15803d" }}>Được phép đến cổng với xe {booking.gateEntryOrder.vehiclePlate}. Qua cổng trước: {bookingTime(booking.gateEntryOrder.validUntil)}.</Text>}
    {booking.gateEntryOrder?.status === "expired" && <Text style={{ color: "#a16207" }}>Lệnh vào cổng đã hết hạn. Chờ điều độ gọi lại; lịch hẹn vẫn được giữ.</Text>}
    {dispatch?.holdUntil && booking.coordination?.isHeld && <Text style={{ color: "#a16207" }}>Chờ dự kiến đến: {bookingTime(dispatch.holdUntil)}</Text>}
    {!dispatch && <>
      <Text style={ui.muted}>Khi xe đến khu chờ của cảng và có thể vào cổng, hãy báo cho điều độ.</Text>
      {button("Đã đến cổng & sẵn sàng", "arrive", !booking.coordination?.canArrive)}
      {!booking.coordination?.canArrive && <Text style={ui.muted}>Có thể xác nhận từ 3 ngày trước giờ hẹn.</Text>}
    </>}
    {dispatch?.status === "ready" && button("Tạm thời chưa sẵn sàng", "not-ready", false, true)}
    {dispatch?.status === "arrived" && button("Tôi đã sẵn sàng", "ready")}
    {booking.gateEntryOrder?.status === "active" && !["checked_in", "completed"].includes(String(booking.status || "").toLowerCase()) &&
      <TouchableOpacity accessibilityRole="button" disabled={busy || disabled || !!feedError} onPress={() => void passedGate()}
        style={{ padding: 14, borderRadius: 12, backgroundColor: "#15803d", opacity: busy || disabled || feedError ? 0.45 : 1 }}>
        <Text style={{ color: "white", textAlign: "center", fontWeight: "700" }}>Tôi đã qua cổng vào</Text>
      </TouchableOpacity>}
    {dispatch?.status === "called" && <>
      <Text style={{ color: "#9a3412" }}>Phản hồi trước: {bookingTime(dispatch.callExpiresAt || "")}</Text>
      {button("Tôi đã nhận lệnh gọi", "acknowledge", !booking.coordination?.canAcknowledge)}
    </>}
    {busy && <ActivityIndicator color="#ff682c" />}
    {error && <Text accessibilityRole="alert" style={{ color: "#b91c1c" }}>{error}</Text>}
  </View>;
}
