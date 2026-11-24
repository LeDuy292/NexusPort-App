import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useState } from "react";
import { useBookings } from "../../src/features/bookings/BookingProvider";
import { DriverArrivalCard } from "../../src/features/bookings/components/DriverArrivalCard";
import { STATUS_CONFIG, buildTripFlow, isBeforeGateIn } from "../../src/features/driver/tripFlow";
import { getTransportOrderDetail, returnVehicle, type TripDetail } from "../../src/features/driver/services/tripService";

function formatDateTime(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const bookings = useBookings().feed?.bookings ?? [];

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getTransportOrderDetail(id);
      setTrip(data);
    } catch (err: any) {
      Alert.alert("Lỗi", err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const booking = bookings.find((b) => b.id === trip?.bookingId) || null;
  const bookingStatus = booking?.status;
  useEffect(() => { void load(); }, [load, bookingStatus]);

  const finishTrip = async () => {
    if (!trip) return;
    setActionLoading(true);
    try {
      await returnVehicle(trip.id);
      await load();
      Alert.alert("Thành công", "Đã xác nhận trả xe và hoàn thành chuyến.");
    } catch (err: any) {
      Alert.alert("Không thể thực hiện", err.message || "Có lỗi xảy ra.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#f4f6f8", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#ff682c" />
      </View>
    );
  }

  if (!trip) {
    return (
      <View style={{ flex: 1, backgroundColor: "#f4f6f8", alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#64748b" }}>Không tìm thấy chuyến.</Text>
      </View>
    );
  }

  const cfg = STATUS_CONFIG[trip.status] ?? { label: trip.status, color: "#64748b", icon: "information-outline" };
  const isDone = trip.status === "Completed" || trip.status === "Cancelled";
  const canFinish = trip.status === "Gate Out Completed";
  const flow = buildTripFlow(trip, booking);
  const history = trip.history?.filter((entry) => !isBeforeGateIn(entry.toStatus)) ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      {/* Header */}
      <View
        style={{
          paddingTop: 54,
          paddingBottom: 16,
          paddingHorizontal: 20,
          backgroundColor: "#ffffff",
          borderBottomWidth: 1,
          borderBottomColor: "#f1f5f9",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#f8fafc",
                borderWidth: 1,
                borderColor: "#e2e8f0",
              }}
            >
              <Ionicons name="arrow-back" size={20} color="#0f172a" />
            </TouchableOpacity>
            <View>
              <Text style={{ color: "#0f172a", fontSize: 18, fontWeight: "800", letterSpacing: -0.3 }}>
                Chi tiết chuyến
              </Text>
              <Text style={{ color: "#64748b", fontSize: 12, marginTop: 1, fontWeight: "500" }}>{trip.tripCode}</Text>
            </View>
          </View>
          {/* Status badge */}
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 20,
              backgroundColor: `${cfg.color}15`,
              borderWidth: 1,
              borderColor: `${cfg.color}35`,
            }}
          >
            <Text style={{ color: cfg.color, fontWeight: "700", fontSize: 12 }}>{cfg.label}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Lệnh điều phối xe (khớp với bảng điều phối bên điều độ) */}
        {booking && isBeforeGateIn(trip.status) && <DriverArrivalCard booking={booking} compact />}

        {/* Việc cần làm tiếp theo */}
        {!isDone && flow.current && (
          <View style={{ padding: 14, borderRadius: 14, backgroundColor: "#fff7ed", borderWidth: 1, borderColor: "#fed7aa", gap: 3 }}>
            <Text style={{ color: "#9a3412", fontSize: 11, fontWeight: "800", letterSpacing: 0.5 }}>VIỆC CẦN LÀM TIẾP THEO · {flow.current.actor.toUpperCase()}</Text>
            <Text style={{ color: "#7c2d12", fontSize: 15, fontWeight: "800" }}>{flow.current.label}</Text>
            {flow.current.hint ? <Text style={{ color: "#9a3412", fontSize: 12, lineHeight: 18 }}>{flow.current.hint}</Text> : null}
          </View>
        )}

        {/* Container & Trip Info */}
        <View style={cardStyle}>
          <SectionTitle icon="package-variant" label="Thông tin chuyến" color="#ff682c" />
          <InfoRow label="Container" value={trip.containerNo} />
          <InfoRow label="Loại container" value={trip.containerType} />
          <InfoRow label="Loại hàng" value={trip.cargoType} />
          <InfoRow label="Lịch hẹn" value={trip.bookingCode} />
          <InfoRow label="Loại lịch hẹn" value={trip.bookingType} />
          {trip.appointmentStart && (
            <InfoRow label="Thời gian hẹn" value={`${formatDateTime(trip.appointmentStart)} → ${formatDateTime(trip.appointmentEnd)}`} />
          )}
        </View>

        {/* Vehicle */}
        <View style={cardStyle}>
          <SectionTitle icon="truck" label="Phương tiện" color="#7c3aed" />
          <InfoRow label="Biển số xe" value={trip.truckPlate} />
        </View>

        {/* Gate & Yard */}
        <View style={cardStyle}>
          <SectionTitle icon="map-marker-radius" label="Cổng & Bãi" color="#0369a1" />
          <InfoRow label="Cổng vào" value={trip.gateInCode} />
          <InfoRow label="Cổng ra" value={trip.gateOutCode} />
          <InfoRow label="Block bãi" value={trip.yardBlock} />
          <InfoRow label="Ô bãi" value={trip.yardSlot} />
          {trip.yardInstructions && (
            <View style={{ marginTop: 8, padding: 10, borderRadius: 10, backgroundColor: "rgba(99,179,237,0.06)", borderWidth: 1, borderColor: "rgba(99,179,237,0.15)" }}>
              <Text style={{ color: "#64748b", fontSize: 11, marginBottom: 4 }}>Hướng dẫn đến bãi:</Text>
              <Text style={{ color: "#64748b", fontSize: 13, lineHeight: 20 }}>
                {trip.yardInstructions}
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={() => router.push({ pathname: "/(driver)/yard-navigation", params: trip.bookingId ? { bookingId: trip.bookingId, containerNumber: trip.containerNo } : { id: trip.id } } as any)}
            style={{
              marginTop: 10,
              paddingVertical: 12,
              paddingHorizontal: 14,
              borderRadius: 12,
              backgroundColor: "rgba(99,179,237,0.12)",
              borderWidth: 1,
              borderColor: "rgba(99,179,237,0.3)",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Ionicons name="navigate-circle" size={18} color="#0369a1" />
            <Text style={{ color: "#0369a1", fontWeight: "700", fontSize: 13 }}>
              Xem bản đồ & Điều hướng Yard
            </Text>
          </TouchableOpacity>
        </View>

        {/* Delivery info (nếu đã giao) */}
        {trip.containerCondition || trip.sealNo || trip.recipientName ? (
          <View style={cardStyle}>
            <SectionTitle icon="package-variant-closed-check" label="Thông tin giao container" color="#15803d" />
            <InfoRow label="Số chì" value={trip.sealNo} />
            <InfoRow label="Tình trạng" value={trip.containerCondition} />
            <InfoRow label="Người nhận" value={trip.recipientName} />
          </View>
        ) : null}

        {/* Phiếu e-EIR: chỉ hiện khi bãi đã nhận container và phát hành phiếu */}
        {!!trip.eirNo && (
          <View style={cardStyle}>
            <SectionTitle icon="receipt-text-check-outline" label="Phiếu giao nhận e-EIR" color="#ff682c" />
            <InfoRow label="Số phiếu" value={trip.eirNo} />
            <InfoRow label="Container" value={trip.containerNo} />
            <InfoRow label="Tình trạng vỏ" value={trip.containerCondition} />
            <InfoRow label="Số seal" value={trip.sealNo} />
            {!!trip.eirPhotos?.length && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                {trip.eirPhotos.map((uri, index) => (
                  <Image key={uri + index} source={{ uri }} style={{ width: 96, height: 96, borderRadius: 10, marginRight: 8, backgroundColor: "#f1f5f9" }} />
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* Tiến trình theo giai đoạn: tài xế · điều độ & cổng · nhân viên bãi */}
        <View style={cardStyle}>
          <SectionTitle icon="timeline-clock" label="Tiến trình thực hiện" color="#d97706" />
          <View style={{ marginTop: 10, gap: 14 }}>
            {flow.phases.map((phase) => (
              <View key={phase.title}>
                <Text style={{ color: "#64748b", fontSize: 11, fontWeight: "800", letterSpacing: 0.4, marginBottom: 8 }}>{phase.title.toUpperCase()}</Text>
                {phase.steps.map((step, idx) => {
                  const done = step.state === "done";
                  const active = step.state === "current";
                  const isLast = idx === phase.steps.length - 1;
                  return (
                    <View key={step.key} style={{ flexDirection: "row", alignItems: "flex-start" }}>
                      <View style={{ width: 28, alignItems: "center" }}>
                        <View style={{ width: done ? 22 : 18, height: done ? 22 : 18, borderRadius: 11, backgroundColor: done ? "#16a34a" : active ? "#fff7ed" : "#f1f5f9",
                          borderWidth: active ? 2 : 1, borderColor: active ? "#ff682c" : done ? "#16a34a" : "#cbd5e1", alignItems: "center", justifyContent: "center" }}>
                          {done && <Ionicons name="checkmark" size={12} color="#ffffff" />}
                        </View>
                        {!isLast && <View style={{ width: 2, height: 26, backgroundColor: done ? "#86efac" : "#e2e8f0", marginTop: 2 }} />}
                      </View>
                      <View style={{ flex: 1, marginLeft: 12, paddingBottom: isLast ? 0 : 16 }}>
                        <Text style={{ color: done ? "#0f172a" : active ? "#c2410c" : "#64748b", fontWeight: done || active ? "700" : "500", fontSize: 13 }}>{step.label}</Text>
                        <Text style={{ color: "#94a3b8", fontSize: 11, marginTop: 1 }}>{step.actor}{step.time ? <Text style={{ color: "#16a34a", fontWeight: "600" }}> · {step.time}</Text> : null}</Text>
                        {step.hint ? <Text style={{ color: "#9a3412", fontSize: 11, marginTop: 3, lineHeight: 16 }}>{step.hint}</Text> : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        {/* History */}
        {history.length > 0 && (
          <View style={cardStyle}>
            <SectionTitle icon="history" label="Lịch sử trạng thái" color="#64748b" />
            <View style={{ gap: 8, marginTop: 8 }}>
              {history.reverse().map((h) => (
                <View key={h.id} style={{ flexDirection: "row", gap: 8 }}>
                  <Text style={{ color: "#64748b", fontSize: 11, width: 80, flexShrink: 0 }}>
                    {formatDateTime(h.changedAt)}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#0f172a", fontSize: 12 }}>
                      {h.fromStatus && !isBeforeGateIn(h.fromStatus) ? `${h.fromStatus} → ` : ""}<Text style={{ fontWeight: "700" }}>{h.toStatus}</Text>
                    </Text>
                    {h.note ? (
                      <Text style={{ color: "#64748b", fontSize: 11, marginTop: 1 }}>{h.note}</Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {trip.note && (
          <View style={cardStyle}>
            <SectionTitle icon="note-outline" label="Ghi chú" color="#64748b" />
            <Text style={{ color: "#334155", fontSize: 13, marginTop: 6, lineHeight: 20 }}>{trip.note}</Text>
          </View>
        )}
      </ScrollView>

      {/* Action button — cố định ở dưới */}
      {canFinish && (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: 16,
            paddingBottom: Math.max(Platform.OS === "ios" ? 34 : 16, 16),
            backgroundColor: "#ffffff",
            borderTopWidth: 1,
            borderTopColor: "#e2e8f0",
            shadowColor: "#0f172a",
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.06,
            shadowRadius: 10,
            elevation: 8,
          }}
        >
          <TouchableOpacity
            onPress={() => void finishTrip()}
            disabled={actionLoading}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              paddingVertical: 15,
              borderRadius: 16,
              backgroundColor: actionLoading ? "#cbd5e1" : "#15803d",
              shadowColor: "#15803d",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <MaterialCommunityIcons name="truck-check-outline" size={20} color="#ffffff" />
                <Text style={{ color: "#ffffff", fontWeight: "800", fontSize: 15 }}>
                  Xác nhận trả xe & Hoàn thành
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

    </View>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

const cardStyle = {
  borderRadius: 20,
  padding: 18,
  backgroundColor: "#ffffff" as const,
  borderWidth: 1,
  borderColor: "#e2e8f0" as const,
  shadowColor: "#0f172a",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.04,
  shadowRadius: 8,
  elevation: 2,
};

function SectionTitle({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: `${color}15`, alignItems: "center", justifyContent: "center" }}>
        <MaterialCommunityIcons name={icon as any} size={16} color={color} />
      </View>
      <Text style={{ color: "#0f172a", fontSize: 13, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: "#f8fafc" }}>
      <Text style={{ color: "#64748b", fontSize: 13, flex: 1 }}>{label}</Text>
      <Text style={{ color: "#0f172a", fontSize: 13, fontWeight: "700", flex: 2, textAlign: "right" }}>
        {value}
      </Text>
    </View>
  );
}
