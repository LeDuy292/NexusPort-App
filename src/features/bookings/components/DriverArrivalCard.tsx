import { useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { useBookings } from "../BookingProvider";
import { updateBookingArrival } from "../bookingService";
import { bookingTime, isApproved } from "../bookingPresentation";
import type { DriverBooking } from "../types";
import { ui } from "./BookingUI";

const labels = { arrived: "Đã đến · chưa sẵn sàng", ready: "Đã sẵn sàng · chờ điều độ gọi", called: "Điều độ đang gọi bạn", acknowledged: "Bạn đã nhận lệnh gọi", withdrawn: "Cần xác nhận lại" };

export function DriverArrivalCard({ booking, disabled = false }: { booking: DriverBooking; disabled?: boolean }) {
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
  const button = (title: string, name: Parameters<typeof action>[0], unavailable = false, secondary = false) =>
    <TouchableOpacity accessibilityRole="button" disabled={busy || disabled || !!feedError || unavailable} onPress={() => void action(name)}
      style={{ padding: 14, borderRadius: 12, backgroundColor: secondary ? "#e2e8f0" : "#c45b22", opacity: busy || disabled || feedError || unavailable ? 0.45 : 1 }}>
      <Text style={{ color: secondary ? "#334155" : "white", textAlign: "center", fontWeight: "700" }}>{title}</Text>
    </TouchableOpacity>;
  return <View style={[ui.card, { borderColor: dispatch?.status === "called" ? "#ed6026" : "#395d47" }]}>
    <View style={ui.row}>
      <Text style={[ui.title, { flex: 1 }]}>Đến khu chờ & điều phối</Text>
      <Text style={{ color: realtimeConnected ? "#15803d" : "#a16207", fontSize: 11 }}>{realtimeConnected ? "● Trực tuyến" : "Đang nối lại"}</Text>
    </View>
    <Text style={ui.text}>{dispatch ? labels[dispatch.status] : "Khi đã tới khu chờ được phép và sẵn sàng, hãy xác nhận để điều độ biết."}</Text>
    {dispatch && <Text style={ui.muted}>Đến lúc: {bookingTime(dispatch.arrivedAt)}{booking.coordination?.isLate ? " · Đến muộn" : ""}</Text>}
    {booking.dispatch?.status === "withdrawn" && <Text style={{ color: "#a16207" }}>Lịch hoặc phân công đã thay đổi. Kiểm tra lại trước khi xác nhận đến.</Text>}
    {dispatch?.message && <Text style={ui.text}>{dispatch.message}</Text>}
    {booking.gateEntryOrder?.status === "active" && <Text style={{ color: "#15803d" }}>Được phép đến cổng với xe {booking.gateEntryOrder.vehiclePlate}. Qua cổng trước: {bookingTime(booking.gateEntryOrder.validUntil)}.</Text>}
    {booking.gateEntryOrder?.status === "expired" && <Text style={{ color: "#a16207" }}>Lệnh vào cổng đã hết hạn. Chờ điều độ gọi lại; booking vẫn được giữ.</Text>}
    {dispatch?.holdUntil && booking.coordination?.isHeld && <Text style={{ color: "#a16207" }}>Chờ dự kiến đến: {bookingTime(dispatch.holdUntil)}</Text>}
    {!dispatch && <>
      {button("Đã đến khu chờ & sẵn sàng", "arrive", !booking.coordination?.canArrive)}
      {!booking.coordination?.canArrive && <Text style={ui.muted}>Có thể xác nhận từ 12 giờ trước giờ hẹn.</Text>}
    </>}
    {dispatch?.status === "ready" && button("Tạm thời chưa sẵn sàng", "not-ready", false, true)}
    {dispatch?.status === "arrived" && button("Tôi đã sẵn sàng", "ready")}
    {dispatch?.status === "called" && <>
      <Text style={{ color: "#9a3412" }}>Phản hồi trước: {bookingTime(dispatch.callExpiresAt || "")}</Text>
      {button("Tôi đã nhận lệnh gọi", "acknowledge", !booking.coordination?.canAcknowledge)}
    </>}
    <Text style={ui.muted}>Xác nhận đến và nhận lệnh gọi chưa phải xác nhận xe đã vào cổng. Tiếp tục làm theo hướng dẫn của nhân viên cảng.</Text>
    {busy && <ActivityIndicator color="#ff682c" />}
    {error && <Text accessibilityRole="alert" style={{ color: "#b91c1c" }}>{error}</Text>}
  </View>;
}
