import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useState } from "react";
import { getTransportOrders, type Trip } from "../../src/features/driver/services/tripService";
import { subscribeDriverRealtime } from "../../src/features/driver/services/realtimeService";

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: string }
> = {
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
  Completed: { label: "Hoàn thành", color: "#15803d", icon: "check-circle" },
  Cancelled: { label: "Đã hủy", color: "#b91c1c", icon: "close-circle" },
};

const FILTER_TABS: { key: string; label: string }[] = [
  { key: "IN_PROGRESS", label: "Đang thực hiện" },
  { key: "ASSIGNED", label: "Được giao" },
  { key: "COMPLETED", label: "Hoàn thành" },
  { key: "CANCELLED", label: "Đã hủy" },
  { key: "all", label: "Tất cả" },
];

function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000 && d.getDate() === now.getDate()) {
    return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) + " hôm nay";
  }
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }) +
    " " + d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TripsList() {
  const { status } = useLocalSearchParams<{ status?: string }>();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState(
    status && FILTER_TABS.some((tab) => tab.key === status) ? status : "IN_PROGRESS"
  );
  const [total, setTotal] = useState(0);
  const [realtimeOnline, setRealtimeOnline] = useState(false);

  useEffect(() => {
    if (status && FILTER_TABS.some((tab) => tab.key === status)) setActiveFilter(status);
  }, [status]);

  const load = useCallback(
    async (filter = activeFilter, silent = false) => {
      if (!silent) setLoading(true);
      try {
        const result = await getTransportOrders({ status: filter, limit: 50 });
        setTrips(result.orders || result.trips || []);
        setTotal(result.total);
      } catch (err: any) {
        Alert.alert("Lỗi", err.message || "Không thể tải danh sách lệnh vận chuyển.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeFilter]
  );

  useEffect(() => {
    load(activeFilter);
  }, [activeFilter]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let disposed = false;
    subscribeDriverRealtime({
      onConnected: () => setRealtimeOnline(true),
      onDisconnected: () => setRealtimeOnline(false),
      onConnectionError: () => setRealtimeOnline(false),
      onTripAssigned: () => {
        load(activeFilter, true);
      },
      onTripStatusUpdated: () => {
        load(activeFilter, true);
      },
    }).then((fn) => {
      if (disposed) fn();
      else cleanup = fn;
    }).catch(() => {
      if (!disposed) setRealtimeOnline(false);
    });

    return () => {
      disposed = true;
      if (cleanup) cleanup();
    };
  }, [load, activeFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    load(activeFilter, true);
  };

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
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={{ color: "#0f172a", fontSize: 18, fontWeight: "800", letterSpacing: -0.3 }}>
                  Chuyến vận chuyển
                </Text>
                {realtimeOnline && (
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: "#16a34a",
                    }}
                  />
                )}
              </View>
              {total > 0 && (
                <Text style={{ color: "#64748b", fontSize: 12, marginTop: 1, fontWeight: "500" }}>
                  Tổng cộng {total} chuyến
                </Text>
              )}
            </View>
          </View>

          {/* Refresh icon */}
          <TouchableOpacity
            onPress={onRefresh}
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
            <Ionicons name="refresh" size={18} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
        style={{ flexGrow: 0, backgroundColor: "#ffffff", borderBottomWidth: 1, borderBottomColor: "#f1f5f9" }}
      >
        {FILTER_TABS.map((tab) => {
          const active = tab.key === activeFilter;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveFilter(tab.key)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: active ? "#ff682c" : "#ffffff",
                borderWidth: 1,
                borderColor: active ? "#ff682c" : "#e2e8f0",
                shadowColor: active ? "#ff682c" : "#0f172a",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: active ? 0.25 : 0.03,
                shadowRadius: 4,
                elevation: active ? 3 : 1,
              }}
            >
              <Text
                style={{
                  color: active ? "#ffffff" : "#475569",
                  fontSize: 13,
                  fontWeight: active ? "700" : "600",
                }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* List */}
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#ff682c" />
          <Text style={{ color: "#64748b", marginTop: 12, fontSize: 14, fontWeight: "500" }}>
            Đang tải danh sách chuyến...
          </Text>
        </View>
      ) : trips.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 24,
              backgroundColor: "#f1f5f9",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <MaterialCommunityIcons name="truck-outline" size={40} color="#94a3b8" />
          </View>
          <Text style={{ color: "#0f172a", fontSize: 16, fontWeight: "800" }}>
            Không có chuyến nào
          </Text>
          <Text style={{ color: "#64748b", fontSize: 13, textAlign: "center", marginTop: 6, lineHeight: 20 }}>
            Kéo xuống để làm mới danh sách hoặc chọn nhóm trạng thái khác
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#ff682c"
              colors={["#ff682c"]}
            />
          }
        >
          {trips.map((trip) => {
            const cfg = STATUS_CONFIG[trip.status] ?? {
              label: trip.status,
              color: "#64748b",
              icon: "information-outline",
            };
            const isActive = !["Completed", "Cancelled"].includes(trip.status);

            return (
              <TouchableOpacity
                key={trip.id}
                activeOpacity={0.8}
                onPress={() => router.push(`/(driver)/trip-detail?id=${trip.id}` as any)}
                style={{
                  borderRadius: 20,
                  padding: 18,
                  backgroundColor: "#ffffff",
                  borderWidth: 1,
                  borderColor: isActive ? "rgba(255,104,44,0.3)" : "#e2e8f0",
                  shadowColor: "#0f172a",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                {/* Top row */}
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: `${cfg.color}15`,
                      marginRight: 12,
                    }}
                  >
                    <MaterialCommunityIcons
                      name={cfg.icon as any}
                      size={24}
                      color={cfg.color}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#0f172a", fontWeight: "800", fontSize: 16 }}>
                      {trip.containerNo || "—"}
                    </Text>
                    <Text style={{ color: "#64748b", fontSize: 12, marginTop: 2, fontWeight: "500" }}>
                      {trip.tripCode} · {trip.bookingType || "—"}
                    </Text>
                  </View>
                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 20,
                      backgroundColor: `${cfg.color}15`,
                      borderWidth: 1,
                      borderColor: `${cfg.color}30`,
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: "700", color: cfg.color }}>
                      {cfg.label}
                    </Text>
                  </View>
                </View>

                {/* Info row */}
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 12,
                    paddingTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: "#f1f5f9",
                  }}
                >
                  {trip.truckPlate && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#f8fafc", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                      <MaterialCommunityIcons name="truck" size={13} color="#475569" />
                      <Text style={{ color: "#0f172a", fontSize: 12, fontWeight: "700" }}>
                        {trip.truckPlate}
                      </Text>
                    </View>
                  )}
                  {trip.yardBlock && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#f8fafc", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                      <Ionicons name="location-outline" size={13} color="#475569" />
                      <Text style={{ color: "#334155", fontSize: 12, fontWeight: "600" }}>
                        Vị trí: {trip.yardBlock}{trip.yardSlot ? ` · ${trip.yardSlot}` : ""}
                      </Text>
                    </View>
                  )}
                  {trip.appointmentStart && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#f0f9ff", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                      <Ionicons name="time-outline" size={13} color="#0284c7" />
                      <Text style={{ color: "#0369a1", fontSize: 12, fontWeight: "600" }}>
                        {formatDate(trip.appointmentStart)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Next step indicator for active trips */}
                {isActive && trip.nextStep && (
                  <View
                    style={{
                      marginTop: 12,
                      paddingTop: 10,
                      borderTopWidth: 1,
                      borderTopColor: "#f8fafc",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Ionicons name="arrow-forward-circle" size={16} color="#ff682c" />
                      <Text style={{ color: "#ff682c", fontSize: 12, fontWeight: "700" }}>
                        Bước tiếp: {STATUS_CONFIG[trip.nextStep]?.label || trip.nextStep}
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Text style={{ color: "#64748b", fontSize: 12, fontWeight: "600" }}>Chi tiết</Text>
                      <Ionicons name="chevron-forward" size={14} color="#64748b" />
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
