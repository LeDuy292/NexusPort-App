import { useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { useBookings } from "../BookingProvider";
import { updateBookingArrival } from "../bookingService";
import { bookingTime, isApproved } from "../bookingPresentation";
import type { DriverBooking } from "../types";
import { ui } from "./BookingUI";

const labels = { arrived: "Đã đến · chưa sẵn sàng", ready: "Đã sẵn sàng · chờ điều độ gọi", called: "Điều độ đang gọi bạn", acknowledged: "Bạn đã nhận lệnh gọi", withdrawn: "Cần xác nhận lại" };

export function DriverArrivalCard({ booking }: { booking: DriverBooking }) {
  const { reload, realtimeConnected } = useBookings();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!isApproved(booking.status)) return null;
  const dispatch = booking.dispatch?.status === "withdrawn" ? null : booking.dispatch;
  const action = async (name: "arrive" | "ready" | "not-ready" | "acknowledge") => {
    setBusy(true); setError(null);
    try { await updateBookingArrival(booking, name); await reload(); }
    catch (err) { setError(err instanceof Error ? err.message : "Không gửi được xác nhận."); await reload(); }
    finally { setBusy(false); }
  };
  const button = (title: string, name: Parameters<typeof action>[0], disabled = false, secondary = false) =>
    <TouchableOpacity accessibilityRole="button" disabled={busy || disabled} onPress={() => void action(name)}
      style={{ padding: 14, borderRadius: 12, backgroundColor: secondary ? "#292929" : "#ed6026", opacity: busy || disabled ? 0.45 : 1 }}>
      <Text style={{ color: "white", textAlign: "center", fontWeight: "700" }}>{title}</Text>
    </TouchableOpacity>;
  return <View style={[ui.card, { borderColor: dispatch?.status === "called" ? "#ed6026" : "#395d47" }]}>
    <View style={ui.row}>
      <Text style={[ui.title, { flex: 1 }]}>Đến khu chờ & điều phối</Text>
      <Text style={{ color: realtimeConnected ? "#79d69a" : "#e8b66c", fontSize: 11 }}>{realtimeConnected ? "● Trực tuyến" : "Đang nối lại"}</Text>
    </View>
    <Text style={ui.text}>{dispatch ? labels[dispatch.status] : "Khi đã tới khu chờ được phép và sẵn sàng, hãy xác nhận để điều độ biết."}</Text>
    {dispatch && <Text style={ui.muted}>Đến lúc: {bookingTime(dispatch.arrivedAt)}{booking.coordination?.isLate ? " · Đến muộn" : ""}</Text>}
    {booking.dispatch?.status === "withdrawn" && <Text style={{ color: "#e8b66c" }}>Lịch hoặc phân công đã thay đổi. Kiểm tra lại trước khi xác nhận đến.</Text>}
    {dispatch?.message && <Text style={ui.text}>{dispatch.message}</Text>}
    {dispatch?.holdUntil && booking.coordination?.isHeld && <Text style={{ color: "#e8b66c" }}>Chờ dự kiến đến: {bookingTime(dispatch.holdUntil)}</Text>}
    {!dispatch && <>
      {button("Đã đến khu chờ & sẵn sàng", "arrive", !booking.coordination?.canArrive)}
      {!booking.coordination?.canArrive && <Text style={ui.muted}>Có thể xác nhận từ 12 giờ trước giờ hẹn.</Text>}
    </>}
    {dispatch?.status === "ready" && button("Tạm thời chưa sẵn sàng", "not-ready", false, true)}
    {dispatch?.status === "arrived" && button("Tôi đã sẵn sàng", "ready")}
    {dispatch?.status === "called" && <>
      <Text style={{ color: "#ffb77d" }}>Phản hồi trước: {bookingTime(dispatch.callExpiresAt || "")}</Text>
      {button("Tôi đã nhận lệnh gọi", "acknowledge", !booking.coordination?.canAcknowledge)}
    </>}
    <Text style={ui.muted}>Xác nhận đến và nhận lệnh gọi chưa phải xác nhận xe đã vào cổng. Tiếp tục làm theo hướng dẫn của nhân viên cảng.</Text>
    {busy && <ActivityIndicator color="#ff682c" />}
    {error && <Text accessibilityRole="alert" style={{ color: "#fc8c8c" }}>{error}</Text>}
  </View>;
}
