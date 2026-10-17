import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, type ViewStyle } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useBookings } from "../BookingProvider";
import { BOOKING_STATUS, bookingTime, bookingTypeLabel } from "../bookingPresentation";
import type { DriverBooking } from "../types";

export const ui = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#080808" },
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  card: { padding: 16, borderRadius: 18, backgroundColor: "#141414", borderWidth: 1, borderColor: "#282828", gap: 10 },
  title: { color: "white", fontSize: 17, fontWeight: "700" },
  text: { color: "#d1d1d1", fontSize: 14, lineHeight: 21 },
  muted: { color: "#909090", fontSize: 12, lineHeight: 19 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
});

export function BookingHeader({ title }: { title: string }) {
  return <View style={{ paddingTop: 54, paddingBottom: 18, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", gap: 14 }}>
    <TouchableOpacity accessibilityLabel="Quay lại" onPress={() => router.canGoBack() ? router.back() : router.replace("/(driver)")}>
      <Ionicons name="arrow-back" color="white" size={24} />
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
  return <TouchableOpacity style={[ui.card, style]} onPress={() => router.push({ pathname: "/(driver)/booking-detail", params: { id: booking.id } })}>
    <View style={ui.row}>
      <Text style={ui.title}>{booking.bookingCode}</Text>
      <BookingStatus status={booking.status} />
    </View>
    <Text style={ui.text}>{bookingTypeLabel(booking.bookingType)} · {booking.truckPlate || "Chưa gán xe"}</Text>
    <Text style={ui.muted}>{booking.containers.map((item) => item.containerNo).join(", ") || "Chưa có container"}</Text>
    <Text style={{ color: "#63b3ed", fontSize: 13 }}>{bookingTime(booking.appointmentStart)}</Text>
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
    <View style={[ui.card, { backgroundColor: "#233125", borderColor: "#48bb78", flexDirection: "row" }]}>
      <TouchableOpacity style={{ flex: 1, gap: 5 }} onPress={() => {
        void markRead(banner.id).catch(() => {});
        dismissBanner();
        router.push({ pathname: "/(driver)/booking-detail", params: { id: banner.bookingId } });
      }}>
        <Text style={ui.title}>{banner.title}</Text>
        <Text style={ui.text}>{banner.bookingCode} · Chạm để xem chi tiết</Text>
      </TouchableOpacity>
      <TouchableOpacity accessibilityLabel="Đóng thông báo" onPress={dismissBanner}><Ionicons name="close" size={20} color="white" /></TouchableOpacity>
    </View>
  </View>;
}
