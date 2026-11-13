import { useRef, useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../src/features/auth/AuthProvider";
import { useBookings } from "../../src/features/bookings/BookingProvider";
import { BookingHeader, ui } from "../../src/features/bookings/components/BookingUI";

const MENU_ITEMS = [
  { label: "Lệnh vận chuyển (Chuyến xe)", desc: "Tiến trình 11 bước & vị trí bãi", path: "/(driver)/trips", icon: "truck-fast-outline", color: "#ff682c", bg: "#fff7ed" },
  { label: "Check-in e-Pass (Mã QR)", desc: "Mã ra vào cổng tự động Smart Gate", path: "/(driver)/qr-checkin", icon: "qrcode-scan", color: "#16a34a", bg: "#f0fdf4" },
  { label: "Lịch hẹn cảng", desc: "Khung giờ đã được điều độ phê duyệt", path: "/(driver)/appointments", icon: "calendar-clock", color: "#0284c7", bg: "#f0f9ff" },
  { label: "Booking được giao", desc: "Danh sách booking & thông tin hàng", path: "/(driver)/bookings", icon: "clipboard-list-outline", color: "#ea580c", bg: "#fff7ed" },
  { label: "Báo sự cố khẩn cấp (SOS)", desc: "Báo hỏng xe, sự cố seal, trễ hẹn", path: "/(driver)/incident", icon: "alert-circle-outline", color: "#dc2626", bg: "#fef2f2" },
] as const;

export default function DriverAccount() {
  const { user, signOut } = useAuth();
  const { feed } = useBookings();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);

  const logout = async () => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      await signOut();
    } catch {
      setError("Không thể đăng xuất. Vui lòng thử lại.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  return (
    <View style={ui.page}>
      <BookingHeader title="Tài khoản tài xế" />
      <ScrollView contentContainerStyle={ui.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header Card */}
        <View style={ui.card}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: "#ff682c",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#ff682c",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text style={{ color: "#ffffff", fontSize: 24, fontWeight: "900" }}>
                {(feed?.profile?.fullName || user?.fullName || user?.username || "D").charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#0f172a", fontSize: 18, fontWeight: "800", letterSpacing: -0.3 }}>
                {feed?.profile?.fullName || user?.fullName || user?.username}
              </Text>
              <Text style={{ color: "#ff682c", fontSize: 13, fontWeight: "700", marginTop: 2 }}>
                {feed?.profile?.carrierName || "Công ty vận tải đối tác"}
              </Text>
              <Text style={[ui.muted, { marginTop: 2 }]}>{user?.email || "Tài xế container cảng"}</Text>
            </View>
          </View>

          {/* License & Status badges */}
          <View
            style={{
              flexDirection: "row",
              gap: 8,
              marginTop: 6,
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: "#f1f5f9",
            }}
          >
            <View
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 12,
                backgroundColor: "#f8fafc",
                borderWidth: 1,
                borderColor: "#e2e8f0",
              }}
            >
              <Text style={{ color: "#64748b", fontSize: 11, fontWeight: "600" }}>Giấy phép GPLX</Text>
              <Text style={{ color: "#0f172a", fontSize: 13, fontWeight: "700", marginTop: 2 }}>
                {feed?.profile?.licenseNumber || "Đã xác thực"}
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 12,
                backgroundColor: "rgba(22,163,74,0.08)",
                borderWidth: 1,
                borderColor: "rgba(22,163,74,0.2)",
              }}
            >
              <Text style={{ color: "#16a34a", fontSize: 11, fontWeight: "600" }}>Trạng thái tài khoản</Text>
              <Text style={{ color: "#16a34a", fontSize: 13, fontWeight: "800", marginTop: 2 }}>
                Đang hoạt động ✓
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Menu List */}
        <View style={{ gap: 8 }}>
          <Text style={ui.title}>Tiện ích nghiệp vụ</Text>
          <View
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 20,
              borderWidth: 1,
              borderColor: "#e2e8f0",
              overflow: "hidden",
              shadowColor: "#0f172a",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            {MENU_ITEMS.map((item, idx) => (
              <TouchableOpacity
                key={item.label}
                activeOpacity={0.7}
                onPress={() => router.push(item.path as any)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 16,
                  gap: 14,
                  borderBottomWidth: idx < MENU_ITEMS.length - 1 ? 1 : 0,
                  borderBottomColor: "#f1f5f9",
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: item.bg,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MaterialCommunityIcons name={item.icon as any} size={22} color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#0f172a", fontSize: 14, fontWeight: "700" }}>{item.label}</Text>
                  <Text style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>{item.desc}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          onPress={() => setVisible(true)}
          activeOpacity={0.7}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingVertical: 14,
            borderRadius: 16,
            backgroundColor: "#fef2f2",
            borderWidth: 1,
            borderColor: "#fecaca",
            marginTop: 10,
          }}
        >
          <Ionicons name="log-out-outline" size={18} color="#dc2626" />
          <Text style={{ color: "#dc2626", fontWeight: "700", fontSize: 14 }}>
            Đăng xuất khỏi ứng dụng
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => { if (!busy) setVisible(false); }}>
        <View style={{ flex: 1, justifyContent: "center", backgroundColor: "rgba(15,23,42,0.6)", padding: 24 }}>
          <View accessibilityViewIsModal style={[ui.card, { padding: 24, gap: 16 }]}>
            <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: "#fef2f2", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="alert-circle-outline" size={28} color="#dc2626" />
            </View>
            <Text style={{ color: "#0f172a", fontSize: 18, fontWeight: "800" }}>Đăng xuất tài khoản?</Text>
            <Text style={{ color: "#475569", lineHeight: 22, fontSize: 14 }}>
              Bạn sẽ cần đăng nhập lại để tiếp tục nhận lệnh vận chuyển và theo dõi lộ trình Smart Route.
            </Text>
            {!!error && <Text style={{ color: "#dc2626", fontSize: 13 }}>{error}</Text>}
            <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
              <TouchableOpacity
                disabled={busy}
                onPress={() => setVisible(false)}
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
                <Text style={{ color: "#475569", fontWeight: "700" }}>Ở lại</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={busy}
                onPress={() => void logout()}
                style={{
                  flex: 1,
                  paddingVertical: 13,
                  borderRadius: 12,
                  alignItems: "center",
                  backgroundColor: "#dc2626",
                }}
              >
                <Text style={{ color: "#ffffff", fontWeight: "700" }}>
                  {busy ? "Đang xử lý…" : "Đăng xuất"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
