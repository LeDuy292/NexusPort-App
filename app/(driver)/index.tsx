import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../src/features/auth/AuthProvider";
import { useBookings } from "../../src/features/bookings/BookingProvider";
import { BookingCard, BookingFeedState, ui } from "../../src/features/bookings/components/BookingUI";
import { isApproved } from "../../src/features/bookings/bookingPresentation";

const ACTIONS = [
  { label: "Booking được giao", subtitle: "Xe, hàng hóa & trạng thái duyệt", icon: "clipboard-list-outline", route: "/(driver)/bookings", color: "#ff682c" },
  { label: "Lịch hẹn", subtitle: "Khung giờ booking đã duyệt", icon: "calendar-clock", route: "/(driver)/appointments", color: "#63b3ed" },
  { label: "Chuyến vận chuyển", subtitle: "Các bước thực hiện chuyến", icon: "truck-fast", route: "/(driver)/trips", color: "#9f7aea" },
  { label: "Thông báo", subtitle: "Phân công & kết quả duyệt", icon: "bell-outline", route: "/(driver)/notifications", color: "#48bb78" },
] as const;

export default function DriverHome() {
  const { user, signOut } = useAuth();
  const { feed, loading, reload } = useBookings();
  const bookings = feed?.bookings || [];
  const approved = bookings.filter((booking) => isApproved(booking.status));
  const nextAppointment = approved.filter((booking) => Date.parse(booking.appointmentEnd) >= Date.now())
    .sort((a, b) => Date.parse(a.appointmentStart) - Date.parse(b.appointmentStart))[0];
  const stats = [
    { label: "Chờ duyệt", count: bookings.filter((booking) => booking.status === "pending").length, color: "#f6ad55" },
    { label: "Đã duyệt", count: approved.length, color: "#48bb78" },
    { label: "Thông báo mới", count: feed?.unreadCount || 0, color: "#ff682c" },
  ];
  return <View style={ui.page}>
    <View style={{ paddingTop: 54, paddingHorizontal: 20, paddingBottom: 24, gap: 20 }}>
      <View style={ui.row}>
        <Text style={{ color: "white", fontSize: 22, fontWeight: "800" }}>NexusPort<Text style={{ color: "#ff682c" }}>.</Text></Text>
        <View style={{ flexDirection: "row", gap: 22 }}>
          <TouchableOpacity accessibilityLabel="Thông báo" onPress={() => router.push("/(driver)/notifications")}>
            <Ionicons name="notifications-outline" size={24} color="white" />
            {!!feed?.unreadCount && <View style={{ position: "absolute", top: -8, right: -10, backgroundColor: "#ff682c", borderRadius: 10, paddingHorizontal: 5 }}>
              <Text style={{ color: "white", fontSize: 10 }}>{feed.unreadCount > 99 ? "99+" : feed.unreadCount}</Text>
            </View>}
          </TouchableOpacity>
          <TouchableOpacity accessibilityLabel="Đăng xuất" onPress={() => void signOut()}><Ionicons name="log-out-outline" size={24} color="#aaa" /></TouchableOpacity>
        </View>
      </View>
      <View style={{ gap: 5 }}>
        <Text style={ui.muted}>Xin chào tài xế,</Text>
        <Text style={{ color: "white", fontSize: 24, fontWeight: "700" }}>{feed?.profile?.fullName || user?.fullName || user?.username}</Text>
        <Text style={ui.muted}>{feed?.profile?.carrierName || user?.username}</Text>
      </View>
    </View>
    <ScrollView contentContainerStyle={ui.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void reload()} tintColor="#ff682c" />}>
      <BookingFeedState />
      <View style={{ flexDirection: "row", gap: 10 }}>
        {stats.map((stat) => <View key={stat.label} style={[ui.card, { flex: 1, padding: 12 }]}>
          <Text style={{ color: stat.color, fontSize: 24, fontWeight: "800" }}>{loading || !feed ? "—" : stat.count}</Text>
          <Text style={ui.muted}>{stat.label}</Text>
        </View>)}
      </View>
      <Text style={ui.title}>Công việc của bạn</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {ACTIONS.map((action) => <TouchableOpacity key={action.label} onPress={() => router.push(action.route)} style={[ui.card, { width: "48%", minHeight: 135 }]}>
          <MaterialCommunityIcons name={action.icon} size={28} color={action.color} />
          <Text style={ui.title}>{action.label}</Text>
          <Text style={ui.muted}>{action.subtitle}</Text>
        </TouchableOpacity>)}
      </View>
      {nextAppointment && <>
        <Text style={ui.title}>Lịch hẹn gần nhất</Text>
        <BookingCard booking={nextAppointment} style={{ borderColor: "#63b3ed70" }} />
      </>}
      <View style={ui.row}>
        <Text style={ui.title}>Booking gần đây</Text>
        <TouchableOpacity onPress={() => router.push("/(driver)/bookings")}><Text style={{ color: "#ff682c" }}>Xem tất cả →</Text></TouchableOpacity>
      </View>
      {bookings.slice(0, 3).map((booking) => <BookingCard key={booking.id} booking={booking} />)}
      {feed?.profile && !bookings.length && <Text style={ui.muted}>Chưa có booking được giao. Booking mới sẽ tự xuất hiện tại đây.</Text>}
    </ScrollView>
  </View>;
}
