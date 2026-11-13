import { RefreshControl, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useBookings } from "../../src/features/bookings/BookingProvider";
import { canViewAppointment } from "../../src/features/bookings/bookingPresentation";
import { BookingApprovalNotice, BookingCard, BookingFeedState, BookingHeader, ui } from "../../src/features/bookings/components/BookingUI";

export default function DriverAppointments() {
  const { feed, loading, error, reload } = useBookings();
  const pendingCount = (feed?.bookings || []).filter((booking) => booking.status.toLowerCase() === "pending").length;
  const appointments = (feed?.bookings || [])
    .filter((booking) => canViewAppointment(booking.status))
    .sort((left, right) => Date.parse(left.appointmentStart) - Date.parse(right.appointmentStart));
  const upcoming = appointments.filter((booking) => Date.parse(booking.appointmentEnd) >= Date.now());
  const past = appointments.filter((booking) => Date.parse(booking.appointmentEnd) < Date.now());

  return (
    <View style={ui.page}>
      <BookingHeader title="Lịch hẹn cảng Tiên Sa" />
      <ScrollView
        contentContainerStyle={ui.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void reload()} tintColor="#ff682c" />}
      >
        <BookingFeedState />

        {/* Info card */}
        <View
          style={[
            ui.card,
            {
              backgroundColor: "#f0f9ff",
              borderColor: "#bae6fd",
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            },
          ]}
        >
          <Ionicons name="information-circle-outline" size={22} color="#0284c7" />
          <Text style={{ color: "#0369a1", fontSize: 13, flex: 1, lineHeight: 18 }}>
            Hệ thống chỉ hiển thị lịch hẹn của booking đã được điều độ phê duyệt. Vui lòng đến trước 15-30 phút so với giờ hẹn.
          </Text>
        </View>

        {appointments.length > 0 && pendingCount > 0 && (
          <View style={[ui.card, { backgroundColor: "#fffbeb", borderColor: "#fde68a" }]}>
            <Text style={{ color: "#92400e", fontSize: 13, lineHeight: 20 }}>
              Có <Text style={{ fontWeight: "800" }}>{pendingCount} booking</Text> đang chờ điều độ duyệt chưa xuất hiện trong danh sách lịch hẹn.
            </Text>
          </View>
        )}

        {upcoming.length > 0 && (
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={ui.title}>Lịch hẹn sắp tới ({upcoming.length})</Text>
              <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: "rgba(22,163,74,0.12)" }}>
                <Text style={{ color: "#16a34a", fontSize: 11, fontWeight: "700" }}>Có hiệu lực</Text>
              </View>
            </View>
            {upcoming.map((booking) => (
              <BookingCard key={booking.id} booking={booking} style={{ borderColor: "#86efac", borderWidth: 1.5 }} />
            ))}
          </View>
        )}

        {past.length > 0 && (
          <View style={{ gap: 10, marginTop: 8 }}>
            <Text style={[ui.title, { color: "#64748b" }]}>Đã qua khung giờ ({past.length})</Text>
            {past.map((booking) => (
              <BookingCard key={booking.id} booking={booking} style={{ opacity: 0.8 }} />
            ))}
          </View>
        )}

        {!loading && !error && feed?.profile && !appointments.length && (
          <BookingApprovalNotice pendingCount={pendingCount} />
        )}
      </ScrollView>
    </View>
  );
}
