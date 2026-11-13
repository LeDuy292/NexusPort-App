import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useState } from "react";
import {
  getTransportOrderDetail,
  acknowledgeTrip,
  pickupVehicle,
  pickupContainer,
  returnVehicle,
  TripDetail,
  TripStatus,
  DeliveryData,
} from "../../src/features/driver/services/tripService";

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  Assigned: { label: "Được phân công", color: "#0369a1", icon: "clipboard-check-outline" },
  Acknowledged: { label: "Đã xác nhận", color: "#7c3aed", icon: "hand-okay" },
  "Vehicle Picked Up": { label: "Đã lấy xe", color: "#a16207", icon: "truck-outline" },
  "Container Picked Up": { label: "Đã lấy container", color: "#a16207", icon: "package-variant" },
  "Gate In": { label: "Đã Gate In", color: "#ff682c", icon: "boom-gate-up-outline" },
  "In Transit": { label: "Đang vận chuyển", color: "#ff682c", icon: "truck-fast" },
  "Arrived at Yard": { label: "Đã đến Bãi", color: "#15803d", icon: "map-marker-check" },
  "Container Delivered": { label: "Đã giao container", color: "#15803d", icon: "package-variant-closed-check" },
  "Gate Out Completed": { label: "Đã Gate Out", color: "#15803d", icon: "boom-gate-outline" },
  "Vehicle Returned": { label: "Đã trả xe", color: "#15803d", icon: "truck-check-outline" },
  Completed: { label: "Hoàn thành ✓", color: "#15803d", icon: "check-circle" },
  Cancelled: { label: "Đã hủy", color: "#b91c1c", icon: "close-circle" },
};

// Thứ tự timeline để hiển thị progress
const TIMELINE_STEPS: { status: TripStatus; label: string; timeKey: keyof TripDetail["timeline"] }[] = [
  { status: "Acknowledged", label: "Xác nhận chuyến", timeKey: "acknowledged" },
  { status: "Vehicle Picked Up", label: "Lấy xe", timeKey: "vehiclePickedUp" },
  { status: "Container Picked Up", label: "Lấy container", timeKey: "containerPickedUp" },
  { status: "In Transit", label: "Gate In & Khởi hành", timeKey: "gateIn" },
  { status: "Arrived at Yard", label: "Đến Bãi", timeKey: "arrivedAtYard" },
  { status: "Container Delivered", label: "Giao container", timeKey: "containerDelivered" },
  { status: "Gate Out Completed", label: "Gate Out", timeKey: "gateOut" },
  { status: "Completed", label: "Hoàn thành", timeKey: "completed" },
];

const STATUS_ORDER: Record<string, number> = {
  Assigned: 0, Acknowledged: 1, "Vehicle Picked Up": 2, "Container Picked Up": 3,
  "Gate In": 4, "In Transit": 5, "Arrived at Yard": 6, "Container Delivered": 7,
  "Gate Out Completed": 8, "Vehicle Returned": 9, Completed: 10,
};

interface ActionStep {
  requiredStatus: TripStatus;
  label: string;
  icon: string;
  color: string;
  needsDeliveryForm?: boolean;
}

const ACTION_STEPS: ActionStep[] = [
  { requiredStatus: "Assigned", label: "Xác nhận nhận chuyến", icon: "hand-okay", color: "#0369a1" },
  { requiredStatus: "Acknowledged", label: "Xác nhận đã lấy xe", icon: "truck-outline", color: "#7c3aed" },
  { requiredStatus: "Vehicle Picked Up", label: "Xác nhận đã lấy container", icon: "package-variant", color: "#a16207" },
  { requiredStatus: "Gate Out Completed", label: "Xác nhận trả xe & Hoàn thành", icon: "truck-check-outline", color: "#15803d" },
];

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

  // Delivery form modal
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [deliveryData, setDeliveryData] = useState<DeliveryData>({});

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

  useEffect(() => { load(); }, [load]);

  const handleAction = async (step: ActionStep) => {
    if (!trip) return;
    if (step.needsDeliveryForm) {
      setShowDeliveryForm(true);
      return;
    }
    await executeAction(step);
  };

  const executeAction = async (step: ActionStep, extra?: DeliveryData) => {
    if (!trip) return;
    setActionLoading(true);
    try {
      let updated;
      switch (step.requiredStatus) {
        case "Assigned": updated = await acknowledgeTrip(trip.id); break;
        case "Acknowledged": updated = await pickupVehicle(trip.id); break;
        case "Vehicle Picked Up": updated = await pickupContainer(trip.id); break;
        case "Gate Out Completed": updated = await returnVehicle(trip.id); break;
        default: return;
      }
      // Reload full detail để có history mới
      await load();
      Alert.alert("Thành công ✓", `${step.label} thành công!`);
    } catch (err: any) {
      Alert.alert("Không thể thực hiện", err.message || "Có lỗi xảy ra.");
    } finally {
      setActionLoading(false);
      setShowDeliveryForm(false);
      setDeliveryData({});
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
  const currentOrder = STATUS_ORDER[trip.status] ?? -1;
  const isDone = trip.status === "Completed" || trip.status === "Cancelled";

  // Xác định action step hiện tại
  const currentAction = ACTION_STEPS.find((s) => s.requiredStatus === trip.status);
  const waitingForGate = ["Container Picked Up", "Container Delivered", "Gate In", "In Transit", "Arrived at Yard"].includes(trip.status);

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
        {waitingForGate && (
          <View
            style={{
              padding: 14,
              borderRadius: 14,
              backgroundColor: "#fffbeb",
              borderWidth: 1,
              borderColor: "#fde68a",
              marginBottom: 12,
              gap: 4,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="compass-outline" size={16} color="#d97706" />
              <Text style={{ color: "#92400e", fontWeight: "700", fontSize: 13 }}>
                Theo dõi giao nhận & qua cổng trên Smart Route
              </Text>
            </View>
            <Text style={{ color: "#78350f", fontSize: 12, lineHeight: 18 }}>
              Mở Smart Route trong booking để xác nhận đã đến và nhận container. Cổng xác nhận Gate In / Gate Out tự động khi xe đi qua.
            </Text>
          </View>
        )}
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
        {/* Container & Trip Info */}
        <View style={cardStyle}>
          <SectionTitle icon="package-variant" label="Thông tin chuyến" color="#ff682c" />
          <InfoRow label="Container" value={trip.containerNo} />
          <InfoRow label="Loại container" value={trip.containerType} />
          <InfoRow label="Loại hàng" value={trip.cargoType} />
          <InfoRow label="Booking" value={trip.bookingCode} />
          <InfoRow label="Loại booking" value={trip.bookingType} />
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

        {/* Timeline */}
        <View style={cardStyle}>
          <SectionTitle icon="timeline-clock" label="Tiến trình thực hiện" color="#d97706" />
          <View style={{ marginTop: 10, gap: 0 }}>
            {TIMELINE_STEPS.map((step, idx) => {
              const stepOrder = STATUS_ORDER[step.status] ?? 99;
              const done = currentOrder >= stepOrder;
              const active = trip.status === step.status || (step.status === "In Transit" && ["Gate In", "In Transit"].includes(trip.status));
              const time = trip.timeline[step.timeKey];
              const isLast = idx === TIMELINE_STEPS.length - 1;

              return (
                <View key={step.status} style={{ flexDirection: "row", alignItems: "flex-start" }}>
                  {/* Dot + line */}
                  <View style={{ width: 28, alignItems: "center" }}>
                    <View
                      style={{
                        width: done ? 22 : 18,
                        height: done ? 22 : 18,
                        borderRadius: 11,
                        backgroundColor: done ? "#16a34a" : "#f1f5f9",
                        borderWidth: active ? 2 : 1,
                        borderColor: active ? "#ff682c" : done ? "#16a34a" : "#cbd5e1",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {done && <Ionicons name="checkmark" size={12} color="#ffffff" />}
                    </View>
                    {!isLast && (
                      <View style={{ width: 2, height: 30, backgroundColor: done ? "#86efac" : "#e2e8f0", marginTop: 2 }} />
                    )}
                  </View>

                  {/* Content */}
                  <View style={{ flex: 1, marginLeft: 12, paddingBottom: isLast ? 0 : 22 }}>
                    <Text style={{ color: done ? "#0f172a" : "#64748b", fontWeight: done ? "700" : "500", fontSize: 13 }}>
                      {step.label}
                    </Text>
                    {time ? (
                      <Text style={{ color: "#16a34a", fontSize: 11, fontWeight: "600", marginTop: 2 }}>
                        {formatDateTime(time)}
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* History */}
        {trip.history && trip.history.length > 0 && (
          <View style={cardStyle}>
            <SectionTitle icon="history" label="Lịch sử trạng thái" color="#64748b" />
            <View style={{ gap: 8, marginTop: 8 }}>
              {[...trip.history].reverse().map((h) => (
                <View key={h.id} style={{ flexDirection: "row", gap: 8 }}>
                  <Text style={{ color: "#64748b", fontSize: 11, width: 80, flexShrink: 0 }}>
                    {formatDateTime(h.changedAt)}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#0f172a", fontSize: 12 }}>
                      {h.fromStatus ? `${h.fromStatus} → ` : ""}<Text style={{ fontWeight: "700" }}>{h.toStatus}</Text>
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
      {!isDone && currentAction && (
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
            onPress={() => handleAction(currentAction)}
            disabled={actionLoading}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              paddingVertical: 15,
              borderRadius: 16,
              backgroundColor: actionLoading ? "#cbd5e1" : currentAction.color || "#ff682c",
              shadowColor: currentAction.color || "#ff682c",
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
                <MaterialCommunityIcons name={currentAction.icon as any} size={20} color="#ffffff" />
                <Text style={{ color: "#ffffff", fontWeight: "800", fontSize: 15 }}>
                  {currentAction.label}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Delivery Form Modal */}
      <Modal
        visible={showDeliveryForm}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDeliveryForm(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" }}>
            <View
              style={{
                backgroundColor: "#ffffff",
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: 24,
                gap: 16,
                borderTopWidth: 1,
                borderColor: "#e2e8f0",
              }}
            >
              <Text style={{ color: "#0f172a", fontSize: 18, fontWeight: "800" }}>
                Xác nhận giao container
              </Text>
              <Text style={{ color: "#64748b", fontSize: 13 }}>
                Nhập thông tin giao nhận container (tùy chọn)
              </Text>

              <DeliveryInput
                label="Số chì (seal)"
                placeholder="VD: SL-123456"
                value={deliveryData.sealNo || ""}
                onChangeText={(v) => setDeliveryData((d) => ({ ...d, sealNo: v }))}
              />
              <DeliveryInput
                label="Tình trạng container"
                placeholder="VD: Nguyên chì / Tốt / Móp nhẹ"
                value={deliveryData.containerCondition || ""}
                onChangeText={(v) => setDeliveryData((d) => ({ ...d, containerCondition: v }))}
              />
              <DeliveryInput
                label="Người / Đơn vị tiếp nhận"
                placeholder="VD: Nguyễn Văn B – Bãi A"
                value={deliveryData.recipientName || ""}
                onChangeText={(v) => setDeliveryData((d) => ({ ...d, recipientName: v }))}
              />
              <DeliveryInput
                label="Ghi chú"
                placeholder="Ghi chú thêm (nếu có)"
                value={deliveryData.note || ""}
                onChangeText={(v) => setDeliveryData((d) => ({ ...d, note: v }))}
              />

              <View style={{ flexDirection: "row", gap: 12, marginTop: 6 }}>
                <TouchableOpacity
                  onPress={() => { setShowDeliveryForm(false); setDeliveryData({}); }}
                  style={{ flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: "center", backgroundColor: "#f1f5f9", borderWidth: 1, borderColor: "#e2e8f0" }}
                >
                  <Text style={{ color: "#475569", fontWeight: "700" }}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    const action = ACTION_STEPS.find(s => s.requiredStatus === "Arrived at Yard")!;
                    executeAction(action, deliveryData);
                  }}
                  disabled={actionLoading}
                  style={{ flex: 2, paddingVertical: 14, borderRadius: 14, alignItems: "center", backgroundColor: "#16a34a", flexDirection: "row", justifyContent: "center", gap: 8 }}
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
                      <Text style={{ color: "#ffffff", fontWeight: "800", fontSize: 15 }}>Xác nhận giao</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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

function DeliveryInput({ label, placeholder, value, onChangeText }: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: "#334155", fontSize: 12, fontWeight: "700" }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        style={{
          backgroundColor: "#f8fafc",
          borderRadius: 12,
          padding: 12,
          color: "#0f172a",
          fontSize: 14,
          borderWidth: 1,
          borderColor: "#cbd5e1",
        }}
      />
    </View>
  );
}
