import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useState } from "react";
import {
  getYardNavigation,
  arriveAtYard,
  YardNavigationData,
} from "../../services/tripService";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  Assigned: { label: "Được phân công", color: "#63b3ed", icon: "clipboard-check-outline" },
  Acknowledged: { label: "Đã xác nhận", color: "#9f7aea", icon: "hand-okay" },
  "Vehicle Picked Up": { label: "Đã lấy xe", color: "#f6ad55", icon: "truck-outline" },
  "Container Picked Up": { label: "Đã lấy container", color: "#f6ad55", icon: "package-variant" },
  "Gate In": { label: "Đã Gate In", color: "#ff682c", icon: "boom-gate-up-outline" },
  "In Transit": { label: "Đang vận chuyển", color: "#ff682c", icon: "truck-fast" },
  "Arrived at Yard": { label: "Đã đến Bãi", color: "#48bb78", icon: "map-marker-check" },
  "Container Delivered": { label: "Đã giao container", color: "#48bb78", icon: "package-variant-closed-check" },
  "Gate Out Completed": { label: "Đã Gate Out", color: "#48bb78", icon: "boom-gate-outline" },
  "Vehicle Returned": { label: "Đã trả xe", color: "#48bb78", icon: "truck-check-outline" },
  Completed: { label: "Hoàn thành ✓", color: "#48bb78", icon: "check-circle" },
  Cancelled: { label: "Đã hủy", color: "#fc5b5b", icon: "close-circle" },
};

export default function YardNavigationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [navData, setNavData] = useState<YardNavigationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getYardNavigation(id);
      setNavData(data);
    } catch (err: any) {
      Alert.alert("Lỗi", err.message || "Không thể tải thông tin điều hướng.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenMap = async () => {
    if (!navData?.canNavigate || !navData?.yard?.mapUrl) {
      Alert.alert(
        "Chưa thể điều hướng",
        navData?.navigationBlockReason || "Chỉ cho phép mở điều hướng khi chuyến ở trạng thái In Transit."
      );
      return;
    }

    const { lat, lng } = navData.yard.coordinates;
    const url = Platform.select({
      ios: `maps://app?daddr=${lat},${lng}`,
      android: `google.navigation:q=${lat},${lng}`,
      default: navData.yard.mapUrl,
    });

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(navData.yard.mapUrl);
      }
    } catch {
      await Linking.openURL(navData.yard.mapUrl);
    }
  };

  const handleConfirmArrived = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await arriveAtYard(id, "Tài xế xác nhận đã đến vị trí bãi qua màn hình điều hướng di động");
      Alert.alert("Thành công ✓", "Đã xác nhận đến bãi (Arrived at Yard)!");
      await loadData();
    } catch (err: any) {
      Alert.alert("Không thể thực hiện", err.message || "Có lỗi xảy ra.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#080808", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#ff682c" />
        <Text style={{ color: "rgba(255,255,255,0.5)", marginTop: 12, fontSize: 13 }}>
          Đang tải thông tin vị trí Yard...
        </Text>
      </View>
    );
  }

  if (!navData) {
    return (
      <View style={{ flex: 1, backgroundColor: "#080808", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Text style={{ color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>Không tìm thấy thông tin chuyến.</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.1)" }}
        >
          <Text style={{ color: "white", fontWeight: "600" }}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { yard, container, vehicle, canNavigate, navigationBlockReason, isYardValid, validationMessage, status } = navData;
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: "#aaa", icon: "information-outline" };

  return (
    <View style={{ flex: 1, backgroundColor: "#080808" }}>
      {/* Header */}
      <LinearGradient
        colors={[`${cfg.color}25`, "transparent"]}
        style={{ paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.07)" }}
          >
            <Ionicons name="arrow-back" size={18} color="white" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>
              Di chuyển đến bãi
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{navData.tripCode}</Text>
          </View>
          <View style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: `${cfg.color}20`, borderWidth: 1, borderColor: `${cfg.color}40` }}>
            <Text style={{ color: cfg.color, fontWeight: "700", fontSize: 12 }}>{cfg.label}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Warning or Success Status Banner */}
        {!canNavigate && (
          <View
            style={{
              padding: 14,
              borderRadius: 16,
              backgroundColor: "rgba(246,173,85,0.12)",
              borderWidth: 1,
              borderColor: "rgba(246,173,85,0.3)",
              gap: 6,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <MaterialCommunityIcons name="alert-circle" size={18} color="#f6ad55" />
              <Text style={{ color: "#f6ad55", fontWeight: "700", fontSize: 13, textTransform: "uppercase" }}>
                Chưa thể điều hướng
              </Text>
            </View>
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, lineHeight: 18 }}>
              {navigationBlockReason || "Chỉ cho phép điều hướng khi chuyến đang ở trạng thái In Transit."}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 }}>
              💡 Vui lòng hoàn tất nhận container và Gate In trước khi mở bản đồ.
            </Text>
          </View>
        )}

        {!isYardValid && (
          <View
            style={{
              padding: 14,
              borderRadius: 16,
              backgroundColor: "rgba(252,91,91,0.12)",
              borderWidth: 1,
              borderColor: "rgba(252,91,91,0.3)",
              gap: 6,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#fc5b5b" />
              <Text style={{ color: "#fc5b5b", fontWeight: "700", fontSize: 13, textTransform: "uppercase" }}>
                Thông tin bãi chưa đầy đủ
              </Text>
            </View>
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, lineHeight: 18 }}>
              {validationMessage || "Thông tin vị trí bãi không hợp lệ. Vui lòng liên hệ Dispatcher."}
            </Text>
          </View>
        )}

        {canNavigate && (
          <View
            style={{
              padding: 14,
              borderRadius: 16,
              backgroundColor: "rgba(72,187,120,0.12)",
              borderWidth: 1,
              borderColor: "rgba(72,187,120,0.3)",
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Ionicons name="checkmark-circle" size={20} color="#48bb78" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#48bb78", fontWeight: "700", fontSize: 13 }}>Đã sẵn sàng điều hướng</Text>
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 2 }}>
                Chuyến đang ở trạng thái In Transit. Bạn có thể mở bản đồ để di chuyển.
              </Text>
            </View>
          </View>
        )}

        {/* Destination Yard Card */}
        <View style={cardStyle}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <MaterialCommunityIcons name="office-building-marker" size={18} color="#ff682c" />
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: "700", textTransform: "uppercase" }}>
              ĐIỂM ĐẾN YARD
            </Text>
          </View>

          <Text style={{ color: "white", fontSize: 16, fontWeight: "bold", marginBottom: 4 }}>
            {yard?.name || "Bãi Container Cảng Tiên Sa"}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 18, marginBottom: 12 }}>
            📍 {yard?.address || "Số 01 Yết Kiêu, Phường Thọ Quang, Quận Sơn Trà, TP. Đà Nẵng"}
          </Text>

          {/* Grid Position Info */}
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
            <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 10 }}>
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: "700", textTransform: "uppercase" }}>
                BLOCK BÃI
              </Text>
              <Text style={{ color: "#ff682c", fontSize: 15, fontWeight: "bold", marginTop: 2 }}>
                {yard?.block || "Chưa có"}
              </Text>
            </View>

            <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 10 }}>
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: "700", textTransform: "uppercase" }}>
                VỊ TRÍ Ô (SLOT)
              </Text>
              <Text style={{ color: "#ff682c", fontSize: 15, fontWeight: "bold", marginTop: 2 }}>
                {yard?.slot || "Theo hướng dẫn"}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 10 }}>
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: "700", textTransform: "uppercase" }}>
                CỔNG VÀO (GATE IN)
              </Text>
              <Text style={{ color: "white", fontSize: 13, fontWeight: "bold", marginTop: 2 }}>
                {yard?.gateInCode || "GATE-A1"}
              </Text>
            </View>

            <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 10 }}>
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: "700", textTransform: "uppercase" }}>
                KHU VỰC (ZONE)
              </Text>
              <Text style={{ color: "white", fontSize: 13, fontWeight: "bold", marginTop: 2 }}>
                {yard?.zone || "Bãi Tiên Sa"}
              </Text>
            </View>
          </View>

          {/* Internal Instructions */}
          {yard?.instructions && (
            <View style={{ marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: "rgba(99,179,237,0.08)", borderWidth: 1, borderColor: "rgba(99,179,237,0.2)" }}>
              <Text style={{ color: "#63b3ed", fontSize: 11, fontWeight: "700", marginBottom: 4 }}>
                🛣️ HƯỚNG DẪN DI CHUYỂN NỘI BỘ:
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, lineHeight: 19 }}>
                {yard.instructions}
              </Text>
            </View>
          )}
        </View>

        {/* Cargo & Vehicle Card */}
        <View style={cardStyle}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <MaterialCommunityIcons name="truck-cargo-container" size={18} color="#9f7aea" />
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: "700", textTransform: "uppercase" }}>
              THÔNG TIN VẬN CHUYỂN
            </Text>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
            <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Container</Text>
            <Text style={{ color: "white", fontSize: 13, fontWeight: "bold" }}>{container?.containerNo || "—"}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
            <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Loại Cont</Text>
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>{container?.containerType || "40ft"}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Xe đầu kéo</Text>
            <Text style={{ color: "white", fontSize: 13, fontWeight: "bold" }}>{vehicle?.truckPlate || "—"}</Text>
          </View>
        </View>

        {/* Map Coordinates Summary */}
        <View style={cardStyle}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Ionicons name="location" size={18} color="#48bb78" />
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: "700", textTransform: "uppercase" }}>
              TỌA ĐỘ GPS ĐIỂM ĐÍCH
            </Text>
          </View>
          <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" }}>
            Vĩ độ (Lat): {yard?.coordinates?.lat || 16.1265}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", marginTop: 2 }}>
            Kinh độ (Lng): {yard?.coordinates?.lng || 108.2225}
          </Text>
        </View>
      </ScrollView>

      {/* Floating Bottom Action Bar */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: 16,
          paddingBottom: 28,
          backgroundColor: "#080808",
          borderTopWidth: 1,
          borderTopColor: "rgba(255,255,255,0.08)",
          gap: 10,
        }}
      >
        <TouchableOpacity
          onPress={handleOpenMap}
          disabled={!canNavigate}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            paddingVertical: 15,
            borderRadius: 16,
            backgroundColor: canNavigate ? "#ff682c" : "rgba(255,255,255,0.1)",
          }}
        >
          <Ionicons name="navigate" size={20} color={canNavigate ? "white" : "rgba(255,255,255,0.3)"} />
          <Text style={{ color: canNavigate ? "white" : "rgba(255,255,255,0.3)", fontWeight: "700", fontSize: 15 }}>
            {canNavigate ? "Mở Google Maps điều hướng" : "Chỉ khả dụng khi In Transit"}
          </Text>
        </TouchableOpacity>

        {status === "In Transit" && (
          <TouchableOpacity
            onPress={handleConfirmArrived}
            disabled={actionLoading}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              paddingVertical: 13,
              borderRadius: 14,
              backgroundColor: "#48bb78",
            }}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={18} color="white" />
                <Text style={{ color: "white", fontWeight: "700", fontSize: 14 }}>
                  Xác nhận đã đến bãi (Arrived at Yard)
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const cardStyle = {
  borderRadius: 18,
  padding: 16,
  backgroundColor: "rgba(255,255,255,0.04)" as const,
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.07)" as const,
};
