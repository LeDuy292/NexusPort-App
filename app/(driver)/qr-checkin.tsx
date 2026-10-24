import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Dimensions } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../src/features/auth/AuthProvider";
import { useBookings } from "../../src/features/bookings/BookingProvider";
import { BookingHeader, ui } from "../../src/features/bookings/components/BookingUI";
import { bookingTime, bookingTypeLabel, canViewAppointment } from "../../src/features/bookings/bookingPresentation";

export default function DriverCheckIn() {
  const { user } = useAuth();
  const { feed, loading, reload } = useBookings();
  const params = useLocalSearchParams<{ bookingId?: string }>();
  const bookings = feed?.bookings || [];
  
  // Lấy booking được chọn hoặc booking đã duyệt đầu tiên
  const approvedBookings = bookings.filter((b) => canViewAppointment(b.status));
  const [selectedId, setSelectedId] = useState<string>(
    params.bookingId || approvedBookings[0]?.id || bookings[0]?.id || ""
  );

  const currentBooking = bookings.find((b) => b.id === selectedId) || approvedBookings[0] || bookings[0];

  return (
    <View style={ui.page}>
      <BookingHeader title="Thẻ ra vào cảng điện tử (e-Pass)" />
      
      <ScrollView
        contentContainerStyle={[ui.content, { paddingBottom: 60 }]}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void reload()} tintColor="#ff682c" />}
      >
        {/* Selector nếu có nhiều booking */}
        {approvedBookings.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 8 }}>
            {approvedBookings.map((b) => (
              <TouchableOpacity
                key={b.id}
                onPress={() => setSelectedId(b.id)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 12,
                  backgroundColor: b.id === currentBooking?.id ? "#1d6c56" : "#ffffff",
                  borderWidth: 1,
                  borderColor: b.id === currentBooking?.id ? "#1d6c56" : "#e2e8f0",
                }}
              >
                <Text style={{ color: b.id === currentBooking?.id ? "#ffffff" : "#475569", fontWeight: "700", fontSize: 12 }}>
                  {b.bookingCode}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {!currentBooking ? (
          <View style={[ui.card, { alignItems: "center", paddingVertical: 40, gap: 12 }]}>
            <MaterialCommunityIcons name="qrcode-remove" size={56} color="#94a3b8" />
            <Text style={{ fontSize: 17, fontWeight: "700", color: "#172b3a" }}>Chưa có thẻ e-Pass</Text>
            <Text style={{ color: "#64748b", textAlign: "center", lineHeight: 22, paddingHorizontal: 20 }}>
              Bạn chưa có booking nào được phê duyệt để cấp thẻ vào cảng. Vui lòng kiểm tra mục "Booking được giao" hoặc liên hệ điều độ viên.
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(driver)/bookings" as any)}
              style={{ marginTop: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, backgroundColor: "#ff682c" }}
            >
              <Text style={{ color: "#ffffff", fontWeight: "700" }}>Xem danh sách booking</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            {/* THẺ E-PASS CHÍNH */}
            <View
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 24,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: "#bbf7d0",
                shadowColor: "#1d6c56",
                shadowOpacity: 0.12,
                shadowRadius: 16,
                elevation: 4,
              }}
            >
              {/* Header của thẻ */}
              <View style={{ backgroundColor: "#1d6c56", padding: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
                    <MaterialCommunityIcons name="boom-gate-up" size={22} color="#ffffff" />
                  </View>
                  <View>
                    <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 10, fontWeight: "800", letterSpacing: 1.2 }}>SMART GATE PASS</Text>
                    <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "800" }}>CẢNG TIÊN SA · CỔNG 01</Text>
                  </View>
                </View>
                <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: "#4ade80" }}>
                  <Text style={{ color: "#064e3b", fontWeight: "800", fontSize: 11 }}>HỢP LỆ</Text>
                </View>
              </View>

              {/* Thân thẻ - Mã QR */}
              <View style={{ alignItems: "center", paddingVertical: 24, paddingHorizontal: 20, backgroundColor: "#fafbfc" }}>
                {/* Visual QR Code Display */}
                <View
                  style={{
                    width: 200,
                    height: 200,
                    backgroundColor: "#ffffff",
                    borderRadius: 18,
                    padding: 14,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 2,
                    borderColor: "#1d6c56",
                    shadowColor: "#000",
                    shadowOpacity: 0.08,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
                >
                  {/* Decorative QR Pattern Simulation */}
                  <View style={{ width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}>
                    <MaterialCommunityIcons name="qrcode-scan" size={120} color="#172b3a" />
                    <Text style={{ fontSize: 10, fontWeight: "800", color: "#1d6c56", marginTop: 4, letterSpacing: 1 }}>
                      {currentBooking.bookingCode}
                    </Text>
                  </View>
                </View>

                {/* Barcode & Token */}
                <View style={{ marginTop: 16, alignItems: "center", gap: 4 }}>
                  <View style={{ flexDirection: "row", gap: 3, height: 26, alignItems: "center" }}>
                    {[3, 1, 4, 2, 5, 1, 3, 2, 4, 1, 5, 2, 3, 1, 4, 2, 3, 1, 4].map((w, idx) => (
                      <View key={idx} style={{ width: w, height: 24, backgroundColor: idx % 2 === 0 ? "#172b3a" : "#64748b" }} />
                    ))}
                  </View>
                  <Text style={{ color: "#64748b", fontSize: 11, fontWeight: "700", letterSpacing: 2 }}>
                    EPASS-{currentBooking.bookingCode.slice(-8)}
                  </Text>
                </View>
              </View>

              {/* Răng cưa phân cách vé */}
              <View style={{ flexDirection: "row", alignItems: "center", height: 16, backgroundColor: "#ffffff" }}>
                <View style={{ width: 14, height: 28, borderRadius: 14, backgroundColor: "#f4f6f8", marginLeft: -7 }} />
                <View style={{ flex: 1, borderBottomWidth: 1.5, borderColor: "#cbd5e1", borderStyle: "dashed" }} />
                <View style={{ width: 14, height: 28, borderRadius: 14, backgroundColor: "#f4f6f8", marginRight: -7 }} />
              </View>

              {/* Thông tin chuyến & xe */}
              <View style={{ padding: 20, gap: 12, backgroundColor: "#ffffff" }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <View>
                    <Text style={{ color: "#64748b", fontSize: 11, fontWeight: "600" }}>BIỂN SỐ XE ĐĂNG KÝ</Text>
                    <Text style={{ color: "#172b3a", fontSize: 17, fontWeight: "800", marginTop: 2 }}>
                      {currentBooking.truckPlate || "Chưa gán xe"}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ color: "#64748b", fontSize: 11, fontWeight: "600" }}>LOẠI TÁC NGHIỆP</Text>
                    <Text style={{ color: "#c45b22", fontSize: 15, fontWeight: "700", marginTop: 2 }}>
                      {bookingTypeLabel(currentBooking.bookingType)}
                    </Text>
                  </View>
                </View>

                <View style={{ height: 1, backgroundColor: "#f1f5f9" }} />

                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <View>
                    <Text style={{ color: "#64748b", fontSize: 11, fontWeight: "600" }}>TÀI XẾ</Text>
                    <Text style={{ color: "#172b3a", fontSize: 14, fontWeight: "700", marginTop: 2 }}>
                      {currentBooking.driverName || user?.fullName || user?.username}
                    </Text>
                    <Text style={{ color: "#64748b", fontSize: 11, marginTop: 1 }}>{currentBooking.carrierName}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ color: "#64748b", fontSize: 11, fontWeight: "600" }}>CONTAINER ({currentBooking.containers.length})</Text>
                    <Text style={{ color: "#172b3a", fontSize: 14, fontWeight: "700", marginTop: 2 }}>
                      {currentBooking.containers[0]?.containerNo || "Chưa có"}
                    </Text>
                    {currentBooking.containers.length > 1 && (
                      <Text style={{ color: "#64748b", fontSize: 11, marginTop: 1 }}>
                        +{currentBooking.containers.length - 1} cont khác
                      </Text>
                    )}
                  </View>
                </View>

                <View style={{ height: 1, backgroundColor: "#f1f5f9" }} />

                <View style={{ backgroundColor: "#f8fafc", borderRadius: 12, padding: 12, gap: 4 }}>
                  <Text style={{ color: "#64748b", fontSize: 11, fontWeight: "600" }}>KHUNG GIỜ QUA CỔNG HỢP LỆ</Text>
                  <Text style={{ color: "#0369a1", fontSize: 13, fontWeight: "700" }}>
                    {bookingTime(currentBooking.appointmentStart)} → {bookingTime(currentBooking.appointmentEnd)}
                  </Text>
                  {currentBooking.gateEntryOrder?.validUntil && (
                    <Text style={{ color: "#a16207", fontSize: 11, marginTop: 2 }}>
                      Hạn lệnh vào cổng: {bookingTime(currentBooking.gateEntryOrder.validUntil)}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* HƯỚNG DẪN TẠI CỔNG */}
            <View style={[ui.card, { backgroundColor: "#f0fdf4", borderColor: "#86efac", gap: 8 }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="information-circle" size={20} color="#15803d" />
                <Text style={{ color: "#15803d", fontSize: 14, fontWeight: "700" }}>Hướng dẫn vào cổng</Text>
              </View>
              <Text style={{ color: "#166534", fontSize: 13, lineHeight: 20 }}>
                1. Dừng xe trước vạch camera nhận diện tại Làn 1 hoặc Làn 2 Cổng Tiên Sa.{"\n"}
                2. Giữ nguyên mã QR e-Pass này trên màn hình điện thoại nếu kiosk yêu cầu quét xác nhận.{"\n"}
                3. Khi barie mở, di chuyển vào bãi theo chỉ dẫn bản đồ Smart Route.
              </Text>
            </View>

            {/* CÁC PHÍM HÀNH ĐỘNG */}
            <View style={{ gap: 10 }}>
              <TouchableOpacity
                onPress={() => router.push({ pathname: "/(driver)/yard-navigation", params: { bookingId: currentBooking.id } } as any)}
                style={{
                  backgroundColor: "#1d6c56",
                  borderRadius: 14,
                  paddingVertical: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 8,
                }}
              >
                <MaterialCommunityIcons name="map-marker-path" size={20} color="#ffffff" />
                <Text style={{ color: "#ffffff", fontWeight: "700", fontSize: 15 }}>Mở dẫn đường Smart Route bãi</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push({ pathname: "/(driver)/booking-detail", params: { id: currentBooking.id } } as any)}
                style={{
                  backgroundColor: "#ffffff",
                  borderWidth: 1,
                  borderColor: "#cbd5e1",
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#334155", fontWeight: "600", fontSize: 14 }}>Xem hồ sơ booking chi tiết</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
