import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../src/features/auth/AuthProvider";
import { useBookings } from "../../src/features/bookings/BookingProvider";
import { BookingHeader, ui } from "../../src/features/bookings/components/BookingUI";

const CATEGORIES = [
  { id: "VEHICLE", title: "Hỏng phương tiện", desc: "Hỏng xe, thủng lốp, sự cố động cơ trên đường hoặc tại bãi", icon: "truck-alert", color: "#c45b22" },
  { id: "TRAFFIC", title: "Kẹt xe / Nguy cơ trễ hẹn", desc: "Giao thông tắc nghẽn, thời tiết xấu có thể trễ khung giờ hẹn", icon: "traffic-light", color: "#d97706" },
  { id: "CONTAINER", title: "Hư hại Container / Seal", desc: "Container móp méo, rách seal, bung chốt hoặc sai mã số cont", icon: "package-variant-closed-alert", color: "#dc2626" },
  { id: "YARD", title: "Sự cố trong bãi / Cẩu bãi", desc: "Vướng chướng ngại vật, thiết bị nâng hạ RTG trục trặc", icon: "crane", color: "#7c3aed" },
  { id: "OTHER", title: "Sự cố khác", desc: "Các vấn đề phát sinh khác cần điều độ viên hỗ trợ", icon: "alert-circle-outline", color: "#475569" },
] as const;

export default function DriverIncident() {
  const { user } = useAuth();
  const { feed } = useBookings();
  const activeBooking = feed?.bookings?.[0];

  const [category, setCategory] = useState<typeof CATEGORIES[number]["id"]>("VEHICLE");
  const [urgency, setUrgency] = useState<"NORMAL" | "HIGH">("NORMAL");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập mô tả chi tiết sự cố bạn đang gặp phải.");
      return;
    }

    setSubmitting(true);
    // Giả lập gửi báo cáo về máy chủ điều độ (Dispatcher Incident Queue)
    setTimeout(() => {
      setSubmitting(false);
      setShowSuccessModal(true);
    }, 800);
  };

  const handleFinish = () => {
    setShowSuccessModal(false);
    setDescription("");
    router.replace("/(driver)" as any);
  };

  return (
    <View style={ui.page}>
      <BookingHeader title="Báo cáo sự cố (SOS)" />

      <ScrollView contentContainerStyle={[ui.content, { paddingBottom: 50 }]} keyboardShouldPersistTaps="handled">
        {/* Banner khẩn cấp */}
        <View style={[ui.card, { backgroundColor: "#fff1f2", borderColor: "#fecdd3", gap: 6 }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="warning" size={20} color="#e11d48" />
            <Text style={{ color: "#be123c", fontSize: 15, fontWeight: "700" }}>Thông báo sự cố tới Điều độ cảng</Text>
          </View>
          <Text style={{ color: "#881337", fontSize: 13, lineHeight: 19 }}>
            Thông tin sẽ được chuyển trực tiếp tới phòng Điều độ trung tâm và nhân viên hiện trường để có giải pháp hỗ trợ kịp thời.
          </Text>
        </View>

        {/* Thông tin chuyến xe hiện tại */}
        {activeBooking && (
          <View style={[ui.card, { backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }]}>
            <Text style={{ color: "#64748b", fontSize: 11, fontWeight: "700", textTransform: "uppercase" }}>Chuyến xe liên quan</Text>
            <Text style={{ color: "#172b3a", fontSize: 15, fontWeight: "700", marginTop: 4 }}>{activeBooking.bookingCode}</Text>
            <Text style={{ color: "#475569", fontSize: 13 }}>
              Xe: {activeBooking.truckPlate || "Chưa gán"} · {activeBooking.containers?.[0]?.containerNo || "Container"}
            </Text>
          </View>
        )}

        {/* Chọn mức độ khẩn cấp */}
        <View style={ui.card}>
          <Text style={ui.title}>Mức độ nghiêm trọng</Text>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
            <TouchableOpacity
              onPress={() => setUrgency("NORMAL")}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: "center",
                backgroundColor: urgency === "NORMAL" ? "#f1f5f9" : "#ffffff",
                borderWidth: 2,
                borderColor: urgency === "NORMAL" ? "#475569" : "#e2e8f0",
              }}
            >
              <Text style={{ color: urgency === "NORMAL" ? "#1e293b" : "#64748b", fontWeight: "700", fontSize: 13 }}>
                Bình thường
              </Text>
              <Text style={{ color: "#94a3b8", fontSize: 10, marginTop: 2 }}>Ghi nhận thông tin</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setUrgency("HIGH")}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: "center",
                backgroundColor: urgency === "HIGH" ? "#fee2e2" : "#ffffff",
                borderWidth: 2,
                borderColor: urgency === "HIGH" ? "#ef4444" : "#e2e8f0",
              }}
            >
              <Text style={{ color: urgency === "HIGH" ? "#b91c1c" : "#64748b", fontWeight: "700", fontSize: 13 }}>
                🚨 Khẩn cấp (Cần cứu hộ)
              </Text>
              <Text style={{ color: urgency === "HIGH" ? "#dc2626" : "#94a3b8", fontSize: 10, marginTop: 2 }}>Ưu tiên xử lý ngay</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Danh mục sự cố */}
        <View style={ui.card}>
          <Text style={ui.title}>Loại sự cố</Text>
          <View style={{ gap: 8, marginTop: 6 }}>
            {CATEGORIES.map((cat) => {
              const selected = category === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setCategory(cat.id)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 12,
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderColor: selected ? cat.color : "#e2e8f0",
                    backgroundColor: selected ? `${cat.color}10` : "#ffffff",
                    gap: 12,
                  }}
                >
                  <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: `${cat.color}18`, alignItems: "center", justifyContent: "center" }}>
                    <MaterialCommunityIcons name={cat.icon as any} size={20} color={cat.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#172b3a", fontSize: 13, fontWeight: "700" }}>{cat.title}</Text>
                    <Text style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>{cat.desc}</Text>
                  </View>
                  {selected && <Ionicons name="checkmark-circle" size={20} color={cat.color} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Nhập mô tả */}
        <View style={ui.card}>
          <Text style={ui.title}>Mô tả chi tiết & Vị trí hiện tại</Text>
          <TextInput
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
            placeholder="Ví dụ: Xe bị hỏng phanh cách cổng cảng 2km, hoặc container bị cẩu va chạm móp méo tại Block B..."
            placeholderTextColor="#94a3b8"
            style={{
              backgroundColor: "#f8fafc",
              borderWidth: 1,
              borderColor: "#cbd5e1",
              borderRadius: 12,
              padding: 14,
              fontSize: 14,
              color: "#172b3a",
              minHeight: 110,
              textAlignVertical: "top",
              marginTop: 8,
            }}
          />
        </View>

        {/* Nút gửi */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting}
          style={{
            backgroundColor: urgency === "HIGH" ? "#dc2626" : "#ff682c",
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 8,
            shadowColor: urgency === "HIGH" ? "#dc2626" : "#ff682c",
            shadowOpacity: 0.35,
            shadowRadius: 10,
            elevation: 4,
          }}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <MaterialCommunityIcons name="send" size={20} color="white" />
              <Text style={{ color: "white", fontWeight: "700", fontSize: 15 }}>
                {urgency === "HIGH" ? "Gửi báo động khẩn cấp" : "Gửi báo cáo sự cố"}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Đường dây nóng hỗ trợ */}
        <View style={[ui.card, { backgroundColor: "#f8fafc", marginTop: 8 }]}>
          <Text style={{ color: "#172b3a", fontSize: 14, fontWeight: "700", marginBottom: 8 }}>
            📞 Đường dây nóng khẩn cấp Cảng Tiên Sa
          </Text>
          <View style={{ gap: 6 }}>
            <Text style={{ color: "#475569", fontSize: 13 }}>• Tổng đài Điều độ cảng: <Text style={{ color: "#ff682c", fontWeight: "700" }}>1900 6868</Text></Text>
            <Text style={{ color: "#475569", fontSize: 13 }}>• Đội cứu hộ xe tải & kỹ thuật: <Text style={{ color: "#0369a1", fontWeight: "700" }}>0236 3822 555</Text></Text>
            <Text style={{ color: "#475569", fontSize: 13 }}>• Bảo vệ & An ninh Cổng: <Text style={{ color: "#15803d", fontWeight: "700" }}>0236 3822 111</Text></Text>
          </View>
        </View>
      </ScrollView>

      {/* Modal Báo cáo thành công */}
      <Modal visible={showSuccessModal} transparent animationType="fade" onRequestClose={handleFinish}>
        <View style={{ flex: 1, backgroundColor: "rgba(15,23,42,0.6)", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <View style={{ width: "100%", maxWidth: 360, backgroundColor: "#ffffff", borderRadius: 20, padding: 24, alignItems: "center", gap: 14 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#dcfce7", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="checkmark-circle" size={42} color="#15803d" />
            </View>
            <Text style={{ color: "#172b3a", fontSize: 18, fontWeight: "800", textAlign: "center" }}>
              Đã gửi sự cố thành công!
            </Text>
            <Text style={{ color: "#64748b", fontSize: 13, textAlign: "center", lineHeight: 20 }}>
              Thông tin sự cố đã được ghi nhận trên hệ thống. Nhân viên Điều độ sẽ liên hệ hỗ trợ bạn qua điện thoại trong ít phút.
            </Text>
            <TouchableOpacity
              onPress={handleFinish}
              style={{ width: "100%", paddingVertical: 14, borderRadius: 12, backgroundColor: "#1d6c56", alignItems: "center", marginTop: 6 }}
            >
              <Text style={{ color: "#ffffff", fontWeight: "700", fontSize: 14 }}>Hoàn tất</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
