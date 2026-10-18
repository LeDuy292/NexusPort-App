import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, type ViewStyle } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useBookings } from "../BookingProvider";
import { BOOKING_STATUS, bookingTime, bookingTypeLabel, isApproved } from "../bookingPresentation";
import type { DriverBooking } from "../types";

export const ui = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f4f6f8" },
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  card: { padding: 18, borderRadius: 18, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e2e8f0", gap: 10 },
  title: { color: "#172b3a", fontSize: 17, fontWeight: "700" },
  text: { color: "#334155", fontSize: 14, lineHeight: 22 },
  muted: { color: "#64748b", fontSize: 12, lineHeight: 19 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
});

export function BookingHeader({ title }: { title: string }) {
  return <View style={{ paddingTop: 54, paddingBottom: 18, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", gap: 14 }}>
    <TouchableOpacity accessibilityLabel="Quay lại" onPress={() => router.canGoBack() ? router.back() : router.replace("/(driver)")}>
      <Ionicons name="arrow-back" color="#172b3a" size={24} />
    </TouchableOpacity>
    <Text style={ui.title}>{title}</Text>
  </View>;
}

export function BookingStatus({ status }: { status: string }) {
  const config = BOOKING_STATUS[status.toLowerCase()] || { label: status, color: "#aaa" };
  return <View style={{ alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: `${config.color}18` }}>
    <Text style={{ color: config.color, fontSize: 11, fontWeight: "700" }}>{config.label}</Text>
  </View>;
}

export function BookingCard({ booking, style }: { booking: DriverBooking; style?: ViewStyle }) {
  return <TouchableOpacity style={[ui.card, style]} onPress={() => router.push({ pathname: "/(driver)/booking-detail" as any, params: { id: booking.id } })}>
    <View style={ui.row}>
      <Text style={ui.title}>{booking.bookingCode}</Text>
      <BookingStatus status={booking.status} />
    </View>
    <Text style={ui.text}>{bookingTypeLabel(booking.bookingType)} · {booking.truckPlate || "Chưa gán xe"}</Text>
    <Text style={ui.muted}>{booking.containers.map((item) => item.containerNo).join(", ") || "Chưa có container"}</Text>
    <Text style={{ color: "#0369a1", fontSize: 13 }}>{bookingTime(booking.appointmentStart)}</Text>
    {isApproved(booking.status) && booking.dispatch && booking.dispatch.status !== "withdrawn" && <Text style={{ color: booking.dispatch.status === "called" ? "#b45309" : "#15803d", fontSize: 13 }}>
      {{ arrived: "Đã đến · chưa sẵn sàng", ready: booking.coordination?.isHeld ? "Điều độ yêu cầu chờ thêm" : "Sẵn sàng · chờ điều độ", called: "Điều độ đang gọi · chạm để phản hồi", acknowledged: "Đã nhận lệnh gọi" }[booking.dispatch.status]}
    </Text>}
    <Text style={ui.muted}>{booking.status === "pending" ? "Khung giờ đề xuất · Đang chờ điều độ duyệt" : booking.carrierName}</Text>
  </TouchableOpacity>;
}

export function BookingFeedState() {
  const { loading, error, feed, reload } = useBookings();
  if (loading) return <ActivityIndicator style={{ margin: 20 }} color="#ff682c" />;
  if (error) return <View style={ui.card}>
    <Text style={{ color: "#fc5b5b" }}>{error}</Text>
    <TouchableOpacity onPress={() => void reload()}><Text style={{ color: "#ff682c" }}>Thử lại</Text></TouchableOpacity>
  </View>;
  if (!feed?.profile) return <View style={ui.card}>
    <Text style={ui.title}>Chưa liên kết hồ sơ tài xế</Text>
    <Text style={ui.text}>Nhờ admin chọn hồ sơ tài xế tương ứng trong Quản lý tài khoản. Booking của công ty giao cho hồ sơ đó sẽ xuất hiện tại đây.</Text>
  </View>;
  return null;
}

export function BookingNotificationBanner() {
  const { banner, dismissBanner, markRead } = useBookings();
  if (!banner) return null;
  return <View style={{ position: "absolute", top: 54, left: 16, right: 16, zIndex: 100, elevation: 10 }}>
    <View style={[ui.card, { backgroundColor: "#f0fdf4", borderColor: "#86efac", flexDirection: "row" }]}>
      <TouchableOpacity style={{ flex: 1, gap: 5 }} onPress={() => {
        void markRead(banner.id).catch(() => {});
        dismissBanner();
        router.push({ pathname: "/(driver)/booking-detail" as any, params: { id: banner.bookingId } });
      }}>
        <Text style={ui.title}>{banner.title}</Text>
        <Text style={ui.text}>{banner.bookingCode} · Chạm để xem chi tiết</Text>
      </TouchableOpacity>
      <TouchableOpacity accessibilityLabel="Đóng thông báo" onPress={dismissBanner}><Ionicons name="close" size={20} color="#172b3a" /></TouchableOpacity>
    </View>
  </View>;
}
