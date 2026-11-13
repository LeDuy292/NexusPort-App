import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, type ViewStyle } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useBookings } from "../BookingProvider";
import { BOOKING_STATUS, bookingTime, bookingTypeLabel, canViewAppointment, isApproved } from "../bookingPresentation";
import type { DriverBooking } from "../types";

export const ui = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 48,
  },
  card: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 10,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    color: "#0f172a",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  text: {
    color: "#334155",
    fontSize: 14,
    lineHeight: 22,
  },
  muted: {
    color: "#64748b",
    fontSize: 12,
    lineHeight: 19,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  // Professional Button Styles from ui-ux-pro-max
  btnPrimary: {
    backgroundColor: "#ff682c",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    shadowColor: "#ff682c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  btnPrimaryText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  btnSecondary: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  btnSecondaryText: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "600",
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
});

export function BookingHeader({ title }: { title: string }) {
  return (
    <View
      style={{
        paddingTop: 54,
        paddingBottom: 16,
        paddingHorizontal: 20,
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        backgroundColor: "#ffffff",
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
      }}
    >
      <TouchableOpacity
        accessibilityLabel="Quay lại"
        onPress={() => (router.canGoBack() ? router.back() : router.replace("/(driver)"))}
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          backgroundColor: "#f8fafc",
          borderWidth: 1,
          borderColor: "#e2e8f0",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="arrow-back" color="#0f172a" size={20} />
      </TouchableOpacity>
      <Text style={{ color: "#0f172a", fontSize: 18, fontWeight: "800", flex: 1, letterSpacing: -0.3 }}>
        {title}
      </Text>
    </View>
  );
}

export function BookingStatus({ status }: { status: string }) {
  const config = BOOKING_STATUS[status.toLowerCase()] || { label: status, color: "#64748b" };
  return (
    <View
      style={{
        alignSelf: "flex-start",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        backgroundColor: `${config.color}15`,
        borderWidth: 1,
        borderColor: `${config.color}30`,
      }}
    >
      <Text style={{ color: config.color, fontSize: 11, fontWeight: "700" }}>{config.label}</Text>
    </View>
  );
}

export function BookingCard({ booking, style }: { booking: DriverBooking; style?: ViewStyle }) {
  return (
    <TouchableOpacity
      style={[ui.card, style]}
      activeOpacity={0.8}
      onPress={() => router.push({ pathname: "/(driver)/booking-detail" as any, params: { id: booking.id } })}
    >
      <View style={ui.row}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: "rgba(255,104,44,0.1)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="document-text-outline" size={18} color="#ff682c" />
          </View>
          <Text style={{ color: "#0f172a", fontSize: 17, fontWeight: "800" }}>{booking.bookingCode}</Text>
        </View>
        <BookingStatus status={booking.status} />
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 2 }}>
        <View style={{ backgroundColor: "#f1f5f9", paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 }}>
          <Text style={{ color: "#0f172a", fontSize: 12, fontWeight: "700" }}>
            {booking.truckPlate || "Chưa gán xe"}
          </Text>
        </View>
        <View style={{ backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 }}>
          <Text style={{ color: "#475569", fontSize: 12, fontWeight: "600" }}>
            {bookingTypeLabel(booking.bookingType)}
          </Text>
        </View>
      </View>

      <Text style={[ui.muted, { marginTop: 2 }]}>
        Cont: <Text style={{ color: "#334155", fontWeight: "600" }}>{booking.containers.map((item) => item.containerNo).join(", ") || "Chưa có"}</Text>
      </Text>

      {canViewAppointment(booking.status) ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#f0f9ff", padding: 8, borderRadius: 10 }}>
          <Ionicons name="time-outline" size={16} color="#0284c7" />
          <Text style={{ color: "#0369a1", fontSize: 12, fontWeight: "600" }}>{bookingTime(booking.appointmentStart)}</Text>
        </View>
      ) : booking.status.toLowerCase() === "pending" ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#fffbeb", padding: 8, borderRadius: 10 }}>
          <Ionicons name="hourglass-outline" size={16} color="#d97706" />
          <Text style={{ color: "#a16207", fontSize: 12, fontWeight: "600" }}>Chờ duyệt booking · Lịch hẹn chưa được mở</Text>
        </View>
      ) : null}

      {isApproved(booking.status) && booking.dispatch && booking.dispatch.status !== "withdrawn" && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: booking.dispatch.status === "called" ? "#fef3c7" : "#f0fdf4", padding: 8, borderRadius: 10 }}>
          <Ionicons name={booking.dispatch.status === "called" ? "megaphone-outline" : "checkmark-circle-outline"} size={16} color={booking.dispatch.status === "called" ? "#b45309" : "#16a34a"} />
          <Text style={{ color: booking.dispatch.status === "called" ? "#b45309" : "#15803d", fontSize: 12, fontWeight: "600" }}>
            {{ arrived: "Đã đến · chưa sẵn sàng", ready: booking.coordination?.isHeld ? "Điều độ yêu cầu chờ thêm" : "Sẵn sàng · chờ điều độ", called: "Điều độ đang gọi · chạm để phản hồi", acknowledged: "Đã nhận lệnh gọi" }[booking.dispatch.status]}
          </Text>
        </View>
      )}

      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTopWidth: 1, borderTopColor: "#f1f5f9" }}>
        <Text style={{ color: "#64748b", fontSize: 11 }}>
          {booking.status === "pending" ? "Khung giờ đề xuất · Chờ điều độ" : booking.carrierName}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Text style={{ color: "#ff682c", fontSize: 12, fontWeight: "700" }}>Chi tiết</Text>
          <Ionicons name="chevron-forward" size={14} color="#ff682c" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function BookingApprovalNotice({ pendingCount = 0 }: { pendingCount?: number }) {
  return (
    <View accessibilityRole="alert" style={[ui.card, { backgroundColor: "#fffbeb", borderColor: "#fde68a" }]}>
      <View style={ui.row}>
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#fef3c7", alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="time-outline" size={20} color="#b45309" />
        </View>
        <Text style={[ui.title, { flex: 1, color: "#92400e" }]}>
          {pendingCount ? "Booking đang chờ duyệt" : "Chưa có lịch hẹn đã duyệt"}
        </Text>
      </View>
      <Text style={[ui.text, { color: "#78350f" }]}>
        {pendingCount ? `Bạn có ${pendingCount} booking đang chờ điều độ duyệt. ` : ""}
        Lịch hẹn chỉ hiển thị sau khi booking được duyệt. Khi có kết quả, ứng dụng sẽ tự cập nhật và thông báo cho bạn.
      </Text>
      <Text style={[ui.muted, { color: "#92400e" }]}>
        Bạn vẫn xem được thông tin và trạng thái booking trong mục Booking được giao.
      </Text>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => router.push("/(driver)/bookings")}
        style={{
          marginTop: 6,
          backgroundColor: "#ffffff",
          borderWidth: 1,
          borderColor: "#fde68a",
          paddingVertical: 10,
          paddingHorizontal: 16,
          borderRadius: 12,
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "center",
          gap: 6,
        }}
      >
        <Text style={{ color: "#92400e", fontWeight: "700", fontSize: 13 }}>Xem booking được giao</Text>
        <Ionicons name="arrow-forward" size={14} color="#92400e" />
      </TouchableOpacity>
    </View>
  );
}

export function BookingFeedState() {
  const { loading, error, feed, reload } = useBookings();
  if (loading) return <ActivityIndicator style={{ margin: 20 }} color="#ff682c" />;
  if (error)
    return (
      <View style={[ui.card, { borderColor: "#fecaca", backgroundColor: "#fef2f2" }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons name="alert-circle" size={20} color="#dc2626" />
          <Text style={{ color: "#b91c1c", fontWeight: "700", flex: 1 }}>{error}</Text>
        </View>
        <TouchableOpacity
          onPress={() => void reload()}
          style={[ui.btnPrimary, { backgroundColor: "#dc2626", marginTop: 8 }]}
        >
          <Text style={ui.btnPrimaryText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  if (!feed?.profile)
    return (
      <View style={ui.card}>
        <Text style={ui.title}>Chưa liên kết hồ sơ tài xế</Text>
        <Text style={ui.text}>
          Nhờ admin chọn hồ sơ tài xế tương ứng trong Quản lý tài khoản. Booking của công ty giao cho hồ sơ đó sẽ xuất hiện tại đây.
        </Text>
      </View>
    );
  return null;
}

export function BookingNotificationBanner() {
  const { banner, dismissBanner, markRead } = useBookings();
  if (!banner) return null;
  return (
    <View style={{ position: "absolute", top: 54, left: 16, right: 16, zIndex: 100, elevation: 10 }}>
      <View
        style={[
          ui.card,
          {
            backgroundColor: "#ffffff",
            borderColor: "#ff682c",
            borderLeftWidth: 4,
            flexDirection: "row",
            alignItems: "center",
            shadowColor: "#0f172a",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8,
          },
        ]}
      >
        <TouchableOpacity
          style={{ flex: 1, gap: 4 }}
          onPress={() => {
            void markRead(banner.id).catch(() => {});
            dismissBanner();
            router.push({ pathname: "/(driver)/booking-detail" as any, params: { id: banner.bookingId } });
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="notifications" size={16} color="#ff682c" />
            <Text style={{ color: "#0f172a", fontSize: 14, fontWeight: "700" }}>{banner.title}</Text>
          </View>
          <Text style={{ color: "#475569", fontSize: 13 }}>{banner.bookingCode} · Chạm để xem chi tiết</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityLabel="Đóng thông báo"
          onPress={dismissBanner}
          style={{ padding: 6, borderRadius: 8, backgroundColor: "#f1f5f9" }}
        >
          <Ionicons name="close" size={18} color="#64748b" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
