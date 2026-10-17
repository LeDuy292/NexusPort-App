import { useRef, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Modal } from "react-native";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../src/features/auth/AuthProvider";
import { useBookings } from "../../src/features/bookings/BookingProvider";
import { BookingCard, BookingFeedState, ui } from "../../src/features/bookings/components/BookingUI";
import { isApproved } from "../../src/features/bookings/bookingPresentation";

const ACTIONS = [
  { label: "Smart Route", subtitle: "Từ Gate In đến điểm giao nhận & cổng ra", icon: "map-marker-path", route: "/(driver)/yard-navigation", color: "#ff922e" },
  { label: "Booking được giao", subtitle: "Xe, hàng hóa & trạng thái duyệt", icon: "clipboard-list-outline", route: "/(driver)/bookings", color: "#ff682c" },
  { label: "Lịch hẹn", subtitle: "Khung giờ booking đã duyệt", icon: "calendar-clock", route: "/(driver)/appointments", color: "#63b3ed" },
  { label: "Chuyến vận chuyển", subtitle: "Các bước thực hiện chuyến", icon: "truck-fast", route: "/(driver)/trips", color: "#9f7aea" },
  { label: "Thông báo", subtitle: "Phân công & kết quả duyệt", icon: "bell-outline", route: "/(driver)/notifications", color: "#48bb78" },
] as const;

export default function DriverHome() {
  const { user, signOut } = useAuth();
  const { feed, loading, reload } = useBookings();
  const [showSignOut, setShowSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const signOutPending = useRef(false);
  const bookings = feed?.bookings || [];
  const approved = bookings.filter((booking) => isApproved(booking.status));
  const nextAppointment = approved.filter((booking) => Date.parse(booking.appointmentEnd) >= Date.now())
    .sort((a, b) => Date.parse(a.appointmentStart) - Date.parse(b.appointmentStart))[0];
  const stats = [
    { label: "Chờ duyệt", count: bookings.filter((booking) => booking.status === "pending").length, color: "#f6ad55" },
    { label: "Đã duyệt", count: approved.length, color: "#48bb78" },
    { label: "Thông báo mới", count: feed?.unreadCount || 0, color: "#ff682c" },
  ];

  const confirmSignOut = () => {
    setSignOutError(null);
    setShowSignOut(true);
  };

  const dismissSignOut = () => {
    if (!signOutPending.current) setShowSignOut(false);
  };

  const handleSignOut = async () => {
    if (signOutPending.current) return;
    signOutPending.current = true;
    setSigningOut(true);
    setSignOutError(null);
    try {
      // AuthProvider clears saved credentials; the protected stack returns to login.
      await signOut();
    } catch {
      setSignOutError("Không thể xóa phiên đăng nhập. Vui lòng thử đăng xuất lại.");
    } finally {
      signOutPending.current = false;
      setSigningOut(false);
    }
  };

  return <View style={ui.page}>
    <View style={{ paddingTop: 54, paddingHorizontal: 20, paddingBottom: 24, gap: 20 }}>
      <View style={ui.row}>
        <Text style={{ color: "white", fontSize: 22, fontWeight: "800" }}>NexusPort<Text style={{ color: "#ff682c" }}>.</Text></Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity accessibilityLabel="Thông báo" onPress={() => router.push("/(driver)/notifications" as any)}>
            <Ionicons name="notifications-outline" size={24} color="white" />
            {!!feed?.unreadCount && <View style={{ position: "absolute", top: -8, right: -10, backgroundColor: "#ff682c", borderRadius: 10, paddingHorizontal: 5 }}>
              <Text style={{ color: "white", fontSize: 10 }}>{feed.unreadCount > 99 ? "99+" : feed.unreadCount}</Text>
            </View>}
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel="Đăng xuất"
            onPress={confirmSignOut}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              backgroundColor: "rgba(252,91,91,0.12)",
              borderWidth: 1,
              borderColor: "rgba(252,91,91,0.3)",
              paddingHorizontal: 8,
              paddingVertical: 5,
              borderRadius: 10,
            }}
          >
            <Ionicons name="log-out-outline" size={16} color="#fc5b5b" />
            <Text style={{ color: "#fc5b5b", fontSize: 11, fontWeight: "600" }}>Đăng xuất</Text>
          </TouchableOpacity>
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
        {ACTIONS.map((action) => <TouchableOpacity key={action.label} onPress={() => router.push(action.route as any)} style={[ui.card, { width: "48%", minHeight: 135 }]}>
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
        <TouchableOpacity onPress={() => router.push("/(driver)/bookings" as any)}><Text style={{ color: "#ff682c" }}>Xem tất cả →</Text></TouchableOpacity>
      </View>
      {bookings.slice(0, 3).map((booking) => <BookingCard key={booking.id} booking={booking} />)}
      {feed?.profile && !bookings.length && <Text style={ui.muted}>Chưa có booking được giao. Booking mới sẽ tự xuất hiện tại đây.</Text>}

      {/* Thông tin tài xế & Nút Đăng xuất nổi bật */}
      <View style={[ui.card, { marginTop: 24, padding: 16, backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(255,104,44,0.15)", borderWidth: 1, borderColor: "rgba(255,104,44,0.3)", alignItems: "center", justifyContent: "center" }}>
            <MaterialCommunityIcons name="card-account-details-outline" size={24} color="#ff682c" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>{feed?.profile?.fullName || user?.fullName || user?.username || "Tài xế container"}</Text>
            <Text style={ui.muted}>{feed?.profile?.carrierName || user?.username} · {user?.email || "Tài xế cảng"}</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={confirmSignOut}
          activeOpacity={0.7}
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12, backgroundColor: "rgba(252,91,91,0.12)", borderWidth: 1, borderColor: "rgba(252,91,91,0.3)" }}
        >
          <Ionicons name="log-out-outline" size={18} color="#fc5b5b" />
          <Text style={{ color: "#fc5b5b", fontSize: 14, fontWeight: "600" }}>Đăng xuất khỏi tài khoản</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    <Modal visible={showSignOut} transparent animationType="fade" onRequestClose={dismissSignOut}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <View accessibilityViewIsModal style={{ width: "100%", maxWidth: 420, backgroundColor: "#1c1c1e", borderRadius: 18, padding: 24, gap: 18 }}>
          <Text accessibilityRole="header" style={ui.title}>Đăng xuất tài khoản</Text>
          <Text style={{ color: "#ddd", lineHeight: 22 }}>
            Bạn có chắc chắn muốn đăng xuất khỏi tài khoản tài xế "{feed?.profile?.fullName || user?.fullName || user?.username || "Tài xế"}" không?
          </Text>
          {signOutError && <Text accessibilityRole="alert" style={{ color: "#fc5b5b" }}>{signOutError}</Text>}
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity accessibilityRole="button" disabled={signingOut} onPress={dismissSignOut} style={{ flex: 1, padding: 14, borderRadius: 10, alignItems: "center", backgroundColor: "#333", opacity: signingOut ? 0.5 : 1 }}>
              <Text style={{ color: "white", fontWeight: "600" }}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" accessibilityState={{ busy: signingOut, disabled: signingOut }} disabled={signingOut} onPress={() => void handleSignOut()} style={{ flex: 1, padding: 14, borderRadius: 10, alignItems: "center", backgroundColor: "#c73535", opacity: signingOut ? 0.6 : 1 }}>
              <Text style={{ color: "white", fontWeight: "600" }}>{signingOut ? "Đang đăng xuất…" : "Đăng xuất"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  </View>;
}

