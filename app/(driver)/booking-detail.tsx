import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useBookings } from "../../src/features/bookings/BookingProvider";
import { getBooking } from "../../src/features/bookings/bookingService";
import { bookingTime, bookingTypeLabel, canViewAppointment } from "../../src/features/bookings/bookingPresentation";
import { BookingHeader, BookingStatus, ui } from "../../src/features/bookings/components/BookingUI";
import type { DriverBooking } from "../../src/features/bookings/types";

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { feed } = useBookings();
  const [booking, setBooking] = useState<DriverBooking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    if (!id) {
      setError("Thiếu mã booking.");
      return;
    }
    getBooking(id)
      .then((data) => {
        if (active) {
          setBooking(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (active) {
          setBooking(null);
          setError(err.message);
        }
      });
    return () => {
      active = false;
    };
  }, [id, feed, revision]);

  return (
    <View style={ui.page}>
      <BookingHeader title="Chi tiết booking" />
      <ScrollView contentContainerStyle={ui.content} showsVerticalScrollIndicator={false}>
        {error ? (
          <View style={[ui.card, { borderColor: "#fecaca", backgroundColor: "#fef2f2" }]}>
            <Text style={{ color: "#b91c1c", fontWeight: "700" }}>{error}</Text>
            <TouchableOpacity onPress={() => setRevision((value) => value + 1)} style={[ui.btnPrimary, { marginTop: 10 }]}>
              <Text style={ui.btnPrimaryText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : !booking ? (
          <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 60 }}>
            <ActivityIndicator size="large" color="#ff682c" />
            <Text style={[ui.muted, { marginTop: 12 }]}>Đang tải thông tin booking...</Text>
          </View>
        ) : (
          <>
            {/* Header Booking Code & Status */}
            <View style={ui.card}>
              <View style={ui.row}>
                <View>
                  <Text style={{ color: "#64748b", fontSize: 11, fontWeight: "700", textTransform: "uppercase" }}>MÃ BOOKING</Text>
                  <Text style={{ color: "#0f172a", fontSize: 24, fontWeight: "900", letterSpacing: -0.5, marginTop: 2 }}>
                    {booking.bookingCode}
                  </Text>
                </View>
                <BookingStatus status={booking.status} />
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                <View style={{ backgroundColor: "#f1f5f9", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                  <Text style={{ color: "#0f172a", fontSize: 12, fontWeight: "700" }}>
                    {bookingTypeLabel(booking.bookingType)}
                  </Text>
                </View>
                <Text style={{ color: "#64748b", fontSize: 13 }}>{booking.carrierName}</Text>
              </View>

              {booking.status === "completed" && (
                <View style={{ backgroundColor: "#f0fdf4", padding: 10, borderRadius: 10, marginTop: 4 }}>
                  <Text style={{ color: "#166534", fontSize: 12, lineHeight: 18 }}>
                    Đã hoàn tất giao nhận tại bãi. Hành trình sẽ ghi nhận khi xe Gate Out qua cổng.
                  </Text>
                </View>
              )}
            </View>

            {/* Appointment Schedule */}
            <View
              style={[
                ui.card,
                {
                  borderColor: canViewAppointment(booking.status) ? "#bbf7d0" : "#fde68a",
                  backgroundColor: canViewAppointment(booking.status) ? "#ffffff" : "#fffbeb",
                },
              ]}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons
                  name={canViewAppointment(booking.status) ? "calendar" : "hourglass-outline"}
                  size={20}
                  color={canViewAppointment(booking.status) ? "#16a34a" : "#d97706"}
                />
                <Text style={[ui.title, { color: canViewAppointment(booking.status) ? "#0f172a" : "#92400e" }]}>
                  {canViewAppointment(booking.status)
                    ? "Lịch hẹn đã được phê duyệt"
                    : booking.status === "pending"
                    ? "Chờ điều độ duyệt booking"
                    : "Lịch hẹn không còn hiệu lực"}
                </Text>
              </View>

              {canViewAppointment(booking.status) && (
                <View style={{ backgroundColor: "#f8fafc", padding: 12, borderRadius: 12, gap: 6, marginTop: 4 }}>
                  <Text style={{ color: "#334155", fontSize: 13 }}>
                    <Text style={{ fontWeight: "700" }}>Từ:</Text> {bookingTime(booking.appointmentStart)}
                  </Text>
                  <Text style={{ color: "#334155", fontSize: 13 }}>
                    <Text style={{ fontWeight: "700" }}>Đến:</Text> {bookingTime(booking.appointmentEnd)}
                  </Text>
                  {booking.approvedAt && (
                    <Text style={ui.muted}>Được duyệt lúc: {bookingTime(booking.approvedAt)}</Text>
                  )}
                </View>
              )}

              {booking.status === "pending" && (
                <Text style={{ color: "#78350f", lineHeight: 21, fontSize: 13 }}>
                  Booking này đang chờ điều độ duyệt nên chưa có lịch hẹn để thực hiện. Lịch và các bước xác nhận sẽ mở sau khi được duyệt.
                </Text>
              )}

              {canViewAppointment(booking.status) && (
                <TouchableOpacity
                  onPress={() => router.push("/(driver)/appointments")}
                  style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}
                >
                  <Text style={{ color: "#ff682c", fontWeight: "700", fontSize: 13 }}>Xem trong lịch hẹn cảng</Text>
                  <Ionicons name="arrow-forward" size={14} color="#ff682c" />
                </TouchableOpacity>
              )}

              {booking.rejectedReason && (
                <View style={{ backgroundColor: "#fef2f2", padding: 10, borderRadius: 8 }}>
                  <Text style={{ color: "#dc2626", fontSize: 12 }}>Lý do từ chối: {booking.rejectedReason}</Text>
                </View>
              )}
            </View>

            {/* Smart Route Navigation Callout */}
            {canViewAppointment(booking.status) && (
              <TouchableOpacity
                style={[
                  ui.card,
                  {
                    backgroundColor: "#fff7ed",
                    borderColor: "#fed7aa",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  },
                ]}
                onPress={() => router.push({ pathname: "/(driver)/yard-navigation", params: { bookingId: booking.id } })}
              >
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <MaterialCommunityIcons name="map-marker-path" size={18} color="#ea580c" />
                    <Text style={{ color: "#ea580c", fontWeight: "800", fontSize: 14 }}>
                      Theo dõi hành trình & Smart Route
                    </Text>
                  </View>
                  <Text style={{ color: "#9a3412", fontSize: 12 }}>
                    Cổng vào ➔ Vị trí giao nhận tại bãi ➔ Cổng ra
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ea580c" />
              </TouchableOpacity>
            )}

            {/* Vehicle & Driver Info */}
            <View style={ui.card}>
              <Text style={ui.title}>Xe & Tài xế phụ trách</Text>
              <View style={{ gap: 8, marginTop: 4 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={ui.muted}>Biển số xe</Text>
                  <Text style={{ color: "#0f172a", fontWeight: "700" }}>{booking.truckPlate || "Chưa gán xe"}</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={ui.muted}>Tài xế</Text>
                  <Text style={{ color: "#0f172a", fontWeight: "700" }}>{booking.driverName || "Chưa gán"}</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={ui.muted}>Công ty vận tải</Text>
                  <Text style={{ color: "#0f172a", fontWeight: "600" }}>{booking.carrierName}</Text>
                </View>
              </View>
            </View>

            {/* Containers List */}
            <Text style={ui.title}>Danh sách container ({booking.containers.length})</Text>
            {booking.containers.map((container) => (
              <View key={container.id} style={ui.card}>
                <View style={ui.row}>
                  <Text style={{ color: "#0f172a", fontSize: 16, fontWeight: "800" }}>{container.containerNo}</Text>
                  <View style={{ backgroundColor: "#f1f5f9", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                    <Text style={{ color: "#475569", fontSize: 11, fontWeight: "700" }}>
                      {container.containerType || "Container"}
                    </Text>
                  </View>
                </View>

                <View style={{ gap: 6, marginTop: 4 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={ui.muted}>Loại hàng hóa</Text>
                    <Text style={{ color: "#334155", fontWeight: "600" }}>{container.cargoType || "Chưa khai báo"}</Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={ui.muted}>Tải trọng</Text>
                    <Text style={{ color: "#334155", fontWeight: "600" }}>
                      {container.grossWeightKg == null ? "Chưa khai báo" : `${Number(container.grossWeightKg).toLocaleString("vi-VN")} kg`}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={ui.muted}>Tình trạng hàng</Text>
                    <Text style={{ color: "#334155", fontWeight: "600" }}>
                      {container.loadStatus === "empty" ? "Rỗng" : container.loadStatus === "laden" || container.loadStatus === "full" ? "Có hàng" : container.loadStatus || "Chưa khai báo"}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={ui.muted}>Số niêm chì (Seal)</Text>
                    <Text style={{ color: "#0f172a", fontWeight: "700" }}>{container.sealNumber || "Chưa có"}</Text>
                  </View>
                  {container.customerName && (
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={ui.muted}>Chủ hàng</Text>
                      <Text style={{ color: "#334155", fontWeight: "500" }}>{container.customerName}</Text>
                    </View>
                  )}
                </View>

                {canViewAppointment(booking.status) && (
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => router.push({ pathname: "/(driver)/yard-navigation", params: { bookingId: booking.id, containerId: container.id } } as any)}
                    style={{
                      marginTop: 8,
                      padding: 13,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: "#ffedd5",
                      backgroundColor: "#fff7ed",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Ionicons name="navigate-circle" size={18} color="#ea580c" />
                      <Text style={{ color: "#ea580c", fontWeight: "700", fontSize: 13 }}>
                        Smart Route · Vị trí bãi & cổng ra
                      </Text>
                    </View>
                    <Text style={[ui.muted, { marginTop: 4, fontSize: 11 }]}>
                      Tự động cập nhật khi cổng xác nhận Gate In và nhân viên bãi hoàn tất thao tác.
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {booking.description && (
              <View style={ui.card}>
                <Text style={ui.title}>Ghi chú nghiệp vụ</Text>
                <Text style={ui.text}>{booking.description}</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
