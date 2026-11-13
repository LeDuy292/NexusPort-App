import { useRef, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Modal } from "react-native";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../src/features/auth/AuthProvider";
import { useBookings } from "../../src/features/bookings/BookingProvider";
import { BookingApprovalNotice, BookingCard, BookingFeedState, ui } from "../../src/features/bookings/components/BookingUI";
import { canViewAppointment, isApproved } from "../../src/features/bookings/bookingPresentation";

const ACTIONS = [
  { label: "Lệnh vận chuyển", subtitle: "Chuyến xe được giao & 11 bước hành trình", icon: "truck-fast-outline", route: "/(driver)/trips", color: "#ff682c", bg: "#fff7ed" },
  { label: "Hành trình Smart Route", subtitle: "Sơ đồ bãi 2D & hướng dẫn điều hướng", icon: "map-marker-path", route: "/(driver)/yard-navigation", color: "#0284c7", bg: "#f0f9ff" },
  { label: "Check-in e-Pass", subtitle: "Mã QR xuất trình tự động tại cổng cảng", icon: "qrcode-scan", route: "/(driver)/qr-checkin", color: "#16a34a", bg: "#f0fdf4" },
  { label: "Booking được giao", subtitle: "Danh sách xe, hàng hóa & trạng thái duyệt", icon: "clipboard-list-outline", route: "/(driver)/bookings", color: "#ea580c", bg: "#fff7ed" },
  { label: "Lịch hẹn", subtitle: "Khung giờ booking cảng đã được duyệt", icon: "calendar-clock", route: "/(driver)/appointments", color: "#0284c7", bg: "#f0f9ff" },
  { label: "Báo sự cố (SOS)", subtitle: "Phản ánh xe, hàng hoặc sự cố tại bãi", icon: "alert-circle-outline", route: "/(driver)/incident", color: "#dc2626", bg: "#fef2f2" },
  { label: "Thông báo", subtitle: "Phân công & kết quả duyệt từ điều độ", icon: "bell-outline", route: "/(driver)/notifications", color: "#8b5cf6", bg: "#f5f3ff" },
  { label: "Tài khoản", subtitle: "Thông tin tài xế & quản lý phiên làm việc", icon: "card-account-details-outline", route: "/(driver)/account", color: "#475569", bg: "#f8fafc" },
] as const;

export default function DriverHome() {
  const { user, signOut } = useAuth();
  const { feed, loading, error, reload } = useBookings();
  const [showSignOut, setShowSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const signOutPending = useRef(false);
  const bookings = feed?.bookings || [];
  const approved = bookings.filter((booking) => isApproved(booking.status));
  const confirmedBookings = bookings.filter((booking) => canViewAppointment(booking.status));
  const pendingCount = bookings.filter((booking) => booking.status.toLowerCase() === "pending").length;
  const nextAppointment = approved
    .filter((booking) => Date.parse(booking.appointmentEnd) >= Date.now())
    .sort((a, b) => Date.parse(a.appointmentStart) - Date.parse(b.appointmentStart))[0];

  const stats = [
    { label: "Chờ duyệt", count: bookings.filter((booking) => booking.status === "pending").length, color: "#d97706", bg: "#fffbeb", borderColor: "#fde68a" },
    { label: "Đã duyệt", count: approved.length, color: "#16a34a", bg: "#f0fdf4", borderColor: "#bbf7d0" },
    { label: "Thông báo mới", count: feed?.unreadCount || 0, color: "#ff682c", bg: "#fff7ed", borderColor: "#fed7aa" },
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
      await signOut();
    } catch {
      setSignOutError("Không thể xóa phiên đăng nhập. Vui lòng thử đăng xuất lại.");
    } finally {
      signOutPending.current = false;
      setSigningOut(false);
    }
  };

  return (
    <View style={ui.page}>
      {/* Top Header */}
      <View
        style={{
          paddingTop: 54,
          paddingHorizontal: 20,
          paddingBottom: 20,
          backgroundColor: "#ffffff",
          borderBottomWidth: 1,
          borderBottomColor: "#f1f5f9",
          gap: 16,
        }}
      >
        <View style={ui.row}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: "#ff682c",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#ff682c",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
                elevation: 3,
              }}
            >
              <MaterialCommunityIcons name="truck-fast" size={20} color="white" />
            </View>
            <Text style={{ color: "#0f172a", fontSize: 22, fontWeight: "900", letterSpacing: -0.5 }}>
              NexusPort<Text style={{ color: "#ff682c" }}>.</Text> <Text style={{ fontSize: 16, fontWeight: "700", color: "#64748b" }}>Driver</Text>
            </Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <TouchableOpacity
              accessibilityLabel="Thông báo"
              onPress={() => router.push("/(driver)/notifications" as any)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: "#f8fafc",
                borderWidth: 1,
                borderColor: "#e2e8f0",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="notifications-outline" size={20} color="#0f172a" />
              {!!feed?.unreadCount && (
                <View
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    backgroundColor: "#ff682c",
                    borderRadius: 10,
                    minWidth: 18,
                    height: 18,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 4,
                    borderWidth: 2,
                    borderColor: "#ffffff",
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 9, fontWeight: "800" }}>
                    {feed.unreadCount > 99 ? "99+" : feed.unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityLabel="Đăng xuất"
              onPress={confirmSignOut}
              style={{
                height: 40,
                paddingHorizontal: 12,
                borderRadius: 12,
                backgroundColor: "#fef2f2",
                borderWidth: 1,
                borderColor: "#fecaca",
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Ionicons name="log-out-outline" size={17} color="#dc2626" />
              <Text style={{ color: "#dc2626", fontSize: 12, fontWeight: "700" }}>Thoát</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Welcome Driver Card */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            padding: 14,
            borderRadius: 16,
            backgroundColor: "#f8fafc",
            borderWidth: 1,
            borderColor: "#e2e8f0",
          }}
        >
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: 23,
              backgroundColor: "#ff682c",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#ffffff", fontSize: 18, fontWeight: "800" }}>
              {(feed?.profile?.fullName || user?.fullName || user?.username || "D").charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#64748b", fontSize: 12, fontWeight: "500" }}>Xin chào tài xế</Text>
            <Text style={{ color: "#0f172a", fontSize: 17, fontWeight: "800" }} numberOfLines={1}>
              {feed?.profile?.fullName || user?.fullName || user?.username}
            </Text>
            <Text style={{ color: "#64748b", fontSize: 12 }} numberOfLines={1}>
              {feed?.profile?.carrierName || "Đơn vị vận tải đối tác"}
            </Text>
          </View>
          <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: "rgba(22,163,74,0.12)", borderWidth: 1, borderColor: "rgba(22,163,74,0.25)" }}>
            <Text style={{ color: "#16a34a", fontSize: 11, fontWeight: "700" }}>Đã kích hoạt</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={ui.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void reload()} tintColor="#ff682c" />}
      >
        <BookingFeedState />

        {/* Stats Row */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          {stats.map((stat) => (
            <View
              key={stat.label}
              style={[
                ui.card,
                {
                  flex: 1,
                  padding: 14,
                  backgroundColor: "#ffffff",
                  borderColor: "#e2e8f0",
                  alignItems: "center",
                },
              ]}
            >
              <Text style={{ color: stat.color, fontSize: 24, fontWeight: "900" }}>
                {loading || !feed ? "—" : stat.count}
              </Text>
              <Text style={[ui.muted, { marginTop: 2, fontSize: 11, fontWeight: "600" }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {!loading && !error && feed?.profile && (!confirmedBookings.length || (!nextAppointment && pendingCount > 0)) && (
          <BookingApprovalNotice pendingCount={pendingCount} />
        )}

        {/* Next Appointment Card */}
        {nextAppointment && (
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={ui.title}>Lịch hẹn cảng tiếp theo</Text>
              <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: "rgba(255,104,44,0.1)" }}>
                <Text style={{ color: "#ff682c", fontSize: 11, fontWeight: "700" }}>Ưu tiên</Text>
              </View>
            </View>
            <BookingCard booking={nextAppointment} style={{ borderColor: "#ff682c", borderWidth: 1.5 }} />
          </View>
        )}

        {/* Quick Operations Section */}
        <View style={{ gap: 12 }}>
          <Text style={ui.title}>Nghiệp vụ vận hành</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.label}
                onPress={() => router.push(action.route as any)}
                activeOpacity={0.7}
                style={[
                  ui.card,
                  {
                    width: "48%",
                    minHeight: 140,
                    padding: 16,
                    justifyContent: "space-between",
                  },
                ]}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: action.bg,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MaterialCommunityIcons name={action.icon as any} size={24} color={action.color} />
                </View>
                <View style={{ gap: 4 }}>
                  <Text style={{ color: "#0f172a", fontSize: 14, fontWeight: "800", letterSpacing: -0.2 }}>
                    {action.label}
                  </Text>
                  <Text style={{ color: "#64748b", fontSize: 11, lineHeight: 15 }} numberOfLines={2}>
                    {action.route === "/(driver)/appointments" && !confirmedBookings.length
                      ? "Mở sau khi booking duyệt"
                      : action.subtitle}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Bookings */}
        <View style={{ gap: 12, marginTop: 4 }}>
          <View style={ui.row}>
            <Text style={ui.title}>Booking được giao gần đây</Text>
            <TouchableOpacity
              onPress={() => router.push("/(driver)/bookings" as any)}
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Text style={{ color: "#ff682c", fontSize: 13, fontWeight: "700" }}>Xem tất cả</Text>
              <Ionicons name="arrow-forward" size={14} color="#ff682c" />
            </TouchableOpacity>
          </View>
          {bookings.slice(0, 3).map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
          {feed?.profile && !bookings.length && (
            <View style={[ui.card, { alignItems: "center", paddingVertical: 24 }]}>
              <Ionicons name="document-text-outline" size={32} color="#cbd5e1" />
              <Text style={[ui.muted, { marginTop: 8 }]}>Chưa có booking được giao.</Text>
            </View>
          )}
        </View>

        {/* Quick Driver Profile Card & Signout */}
        <View
          style={[
            ui.card,
            {
              marginTop: 12,
              padding: 18,
              backgroundColor: "#ffffff",
              borderColor: "#e2e8f0",
            },
          ]}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: "rgba(255,104,44,0.12)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialCommunityIcons name="card-account-details-outline" size={24} color="#ff682c" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#0f172a", fontSize: 15, fontWeight: "800" }}>
                {feed?.profile?.fullName || user?.fullName || user?.username || "Tài xế container"}
              </Text>
              <Text style={ui.muted}>
                {feed?.profile?.carrierName || user?.username} · {user?.email || "Tài xế cảng Tiên Sa"}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={confirmSignOut}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              paddingVertical: 13,
              borderRadius: 12,
              backgroundColor: "#fef2f2",
              borderWidth: 1,
              borderColor: "#fecaca",
            }}
          >
            <Ionicons name="log-out-outline" size={18} color="#dc2626" />
            <Text style={{ color: "#dc2626", fontSize: 14, fontWeight: "700" }}>Đăng xuất khỏi tài khoản</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Sign Out Confirmation Modal */}
      <Modal visible={showSignOut} transparent animationType="fade" onRequestClose={dismissSignOut}>
        <View style={{ flex: 1, backgroundColor: "rgba(15,23,42,0.6)", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <View accessibilityViewIsModal style={{ width: "100%", maxWidth: 380, backgroundColor: "#ffffff", borderRadius: 24, padding: 24, gap: 16 }}>
            <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: "#fef2f2", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="alert-circle-outline" size={28} color="#dc2626" />
            </View>
            <Text accessibilityRole="header" style={{ color: "#0f172a", fontSize: 18, fontWeight: "800" }}>
              Đăng xuất tài khoản?
            </Text>
            <Text style={{ color: "#475569", lineHeight: 22, fontSize: 14 }}>
              Bạn có chắc chắn muốn đăng xuất khỏi tài khoản "{feed?.profile?.fullName || user?.fullName || user?.username || "Tài xế"}" không?
            </Text>
            {signOutError && <Text accessibilityRole="alert" style={{ color: "#dc2626", fontSize: 13 }}>{signOutError}</Text>}
            <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
              <TouchableOpacity
                accessibilityRole="button"
                disabled={signingOut}
                onPress={dismissSignOut}
                style={{
                  flex: 1,
                  paddingVertical: 13,
                  borderRadius: 12,
                  alignItems: "center",
                  backgroundColor: "#f1f5f9",
                  borderWidth: 1,
                  borderColor: "#e2e8f0",
                }}
              >
                <Text style={{ color: "#334155", fontWeight: "700" }}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                disabled={signingOut}
                onPress={() => void handleSignOut()}
                style={{
                  flex: 1,
                  paddingVertical: 13,
                  borderRadius: 12,
                  alignItems: "center",
                  backgroundColor: "#dc2626",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>{signingOut ? "Đang xử lý…" : "Đăng xuất"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
