import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, AppState, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BookingHeader, ui } from "../../src/features/bookings/components/BookingUI";
import { YardRouteMap } from "../../src/features/driver/components/YardRouteMap";
import { arriveAtDestination, confirmYardContainer, getSmartRoute, listSmartRoutes, routeIdentity, selectSmartRoute, type SmartRoute } from "../../src/features/driver/services/smartRouteService";
import { subscribeYardRealtime } from "../../src/features/driver/services/realtimeService";

const PHASES = { to_yard: "Đang đến điểm giao nhận", at_yard: "Đã đến · chờ giao nhận", ready_for_gate_out: "Đã nhận container · đến cổng ra", exited: "Cổng đã xác nhận xe ra bãi" };
const clock = (value?: string | null) => value ? new Date(value).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "Đang chờ";

export default function YardNavigationScreen() {
  const params = useLocalSearchParams<{ bookingId?: string; containerId?: string; containerNumber?: string; id?: string }>();
  const [routes, setRoutes] = useState<SmartRoute[]>([]);
  const [route, setRoute] = useState<SmartRoute | null>(null);
  const [selectedKey, setSelectedKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [changed, setChanged] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [condition, setCondition] = useState<"OK" | "DAMAGED" | "ISSUE">("OK");
  const [notes, setNotes] = useState("");
  const busy = useRef(false);
  const mutationRevision = useRef(0);
  const mounted = useRef(true);
  const previousRevision = useRef<string | null>(null);
  const latestReload = useRef<() => void>(() => {});
  const selected = useRef(selectedKey);
  const requestScope = `${params.bookingId || ""}:${params.containerId || ""}:${params.containerNumber || ""}:${params.id || ""}:${selectedKey}`;
  const currentScope = useRef(requestScope);
  currentScope.current = requestScope;
  selected.current = selectedKey;

  const reload = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    const scope = currentScope.current;
    const mutation = mutationRevision.current;
    setRefreshing(true);
    try {
      const list = await listSmartRoutes();
      if (!mounted.current || scope !== currentScope.current || mutation !== mutationRevision.current) return;
      const items = Array.isArray(list) ? list : [];
      setRoutes(items);
      // Legacy transport IDs cannot select another booking's container.
      const constrained = !!(params.containerId || params.containerNumber || params.bookingId || params.id);
      const candidate = params.id && !params.containerId && !params.containerNumber && !params.bookingId ? undefined
        : constrained ? selectSmartRoute(items, params)
          : selected.current ? items.find(item => routeIdentity(item) === selected.current) : items[0];
      if (candidate && !constrained && !selected.current) {
        selected.current = routeIdentity(candidate);
        setSelectedKey(selected.current);
      }
      const detail = candidate ? await getSmartRoute(candidate.containerId, candidate.bookingId) : null;
      if (!mounted.current || scope !== currentScope.current || mutation !== mutationRevision.current) return;
      const revision = detail ? `${routeIdentity(detail)}:${detail.navigation?.revision}` : null;
      setChanged(previousRevision.current !== null && revision !== null && previousRevision.current !== revision);
      previousRevision.current = revision;
      setRoute(detail);
      setError(null);
    } catch (err) {
      if (mounted.current && scope === currentScope.current && mutation === mutationRevision.current) setError(err instanceof Error ? err.message : "Không tải được tuyến. Vui lòng thử lại.");
    } finally {
      busy.current = false;
      if (mounted.current) {
        setLoading(false); setRefreshing(false);
        if (scope !== currentScope.current || mutation !== mutationRevision.current) latestReload.current();
      }
    }
  }, [params.bookingId, params.containerId, params.containerNumber, params.id]);
  latestReload.current = () => { void reload(); };

  useEffect(() => {
    mounted.current = true;
    void reload();
    const timer = setInterval(() => { if (AppState.currentState !== "background") void reload(); }, 15000);
    const app = AppState.addEventListener("change", state => { if (state === "active") void reload(); });
    let disposed = false;
    let cleanup: (() => void) | undefined;
    void subscribeYardRealtime(() => { if (!disposed) void reload(); }).then(unsubscribe => {
      if (disposed) unsubscribe(); else cleanup = unsubscribe;
    }).catch(() => {});
    return () => { mounted.current = false; disposed = true; clearInterval(timer); app.remove(); cleanup?.(); };
  }, [reload]);

  useEffect(() => { if (selectedKey) void reload(); }, [selectedKey, reload]);

  const execute = async (action: "arrive" | "confirm") => {
    if (!route || error || refreshing) return;
    mutationRevision.current += 1;
    setActionLoading(true);
    try {
      const updated = action === "arrive" ? await arriveAtDestination(route) : await confirmYardContainer(route, condition, notes);
      if (!mounted.current) return;
      setRoute(updated);
      setShowConfirmation(false);
      setNotes("");
      await reload();
      Alert.alert(action === "arrive" ? "Đã đến điểm giao nhận" : "Đã xác nhận container", action === "arrive"
        ? "Điều độ đã nhận trạng thái. Chờ Yard hoàn tất xử lý để xác nhận container."
        : updated.journey?.phase === "ready_for_gate_out" ? "Theo lộ trình đến cổng ra. Nhân viên cổng sẽ xác nhận xe đã đi qua cổng."
          : "Đã ghi nhận giao nhận. Chờ xử lý các container còn lại hoặc hướng dẫn tiếp theo từ điều độ.");
    } catch (err) {
      Alert.alert("Chưa thể xác nhận", err instanceof Error ? err.message : "Vui lòng thử lại.");
      await reload();
    } finally { if (mounted.current) setActionLoading(false); }
  };
  const nav = route?.navigation;
  const journey = route?.journey;
  const exited = journey?.phase === "exited";
  const destination = route?.target?.type === "slot"
    ? `Block ${route.target.block} · Bay ${route.target.bay} · Row ${route.target.row} · Tier ${route.target.tier}`
    : route?.target?.location;
  const enabled = !error && !refreshing && !actionLoading;

  return <View style={ui.page}>
    <BookingHeader title="Smart Route · Điều hướng bãi" />
    <ScrollView contentContainerStyle={[ui.content, { paddingHorizontal: 16 }]} refreshControl={<RefreshControl refreshing={refreshing && !loading} onRefresh={() => void reload()} tintColor="#ff922e" />}>
      <View style={ui.row}>
        <Text style={ui.muted}>Cập nhật tự động mỗi 15 giây</Text>
        <TouchableOpacity accessibilityLabel="Cập nhật lộ trình" disabled={refreshing} onPress={() => void reload()}><Ionicons name="refresh" size={22} color="#ff922e" /></TouchableOpacity>
      </View>
      {loading && <ActivityIndicator size="large" color="#ff922e" />}
      {error && <View accessibilityRole="alert" style={[ui.card, { borderColor: "#bc4757", backgroundColor: "#321b20" }]}>
        <Text style={{ color: "#ffafb9", lineHeight: 21 }}>{error}</Text>
        <Text style={ui.muted}>Tuyến chưa được xác nhận lại. Dừng ở nơi an toàn và kết nối lại trước khi tiếp tục.</Text>
      </View>}
      {!loading && !route && !error && <View style={ui.card}>
        <Text style={ui.title}>Chờ xác nhận Gate In</Text>
        <Text style={ui.text}>{params.id ? "Mở booking được phân công và chọn container để xem đúng lượt xe." : "Điểm đến từ Operation Order và vị trí Yard sẽ xuất hiện sau khi nhân viên cổng xác nhận xe đã qua Gate In."}</Text>
      </View>}
      {!params.bookingId && !params.containerId && !params.containerNumber && !params.id && routes.length > 1 && <ScrollView horizontal contentContainerStyle={{ gap: 8 }}>
        {routes.map(item => <TouchableOpacity key={routeIdentity(item)} disabled={refreshing} onPress={() => { setRoute(null); previousRevision.current = null; setSelectedKey(routeIdentity(item)); }} style={[styles.chip, { borderColor: route && routeIdentity(route) === routeIdentity(item) ? "#ff922e" : "#334154" }]}>
          <Text style={ui.text}>{item.containerNumber}</Text><Text style={ui.muted}>{item.bookingCode}</Text>
        </TouchableOpacity>)}
      </ScrollView>}
      {route && <>
        <View style={[ui.card, { backgroundColor: "#192939", borderColor: "#30455b" }]}>
          <Text style={{ color: "#ffad58", fontWeight: "800", fontSize: 13 }}>{journey ? PHASES[journey.phase] : "Thông tin hành trình"}</Text>
          <Text style={{ color: "white", fontWeight: "800", fontSize: 21 }}>{destination || "Đang chờ phân công điểm đến"}</Text>
          <Text style={ui.text}>{route.containerNumber} · {route.truckPlate || "Chưa gán xe"}</Text>
          <Text style={ui.muted}>{route.bookingCode || route.bookingId}{route.operation?.taskCode ? ` · Lệnh ${route.operation.taskCode}` : ""}</Text>
          <View style={ui.row}><Text style={ui.muted}>Từ {nav?.origin?.label || route.gateCode}</Text><Text style={ui.muted}>{route.target?.zone || ""}</Text></View>
        </View>
        {changed && <Text accessibilityRole="alert" style={{ color: "#7cdac1", lineHeight: 21 }}>Lộ trình hoặc điểm đến vừa được cập nhật. Kiểm tra hướng dẫn mới trước khi di chuyển.</Text>}
        {nav && <View style={[ui.card, { borderColor: nav.status === "available" ? "#356950" : "#9c6630" }]}>
          <Text style={{ color: nav.status === "available" ? "#8cdcb0" : "#ffc382", lineHeight: 21 }}>{nav.message}</Text>
          {nav.status !== "available" && <Text style={ui.text}>Chờ điều độ cung cấp tuyến phù hợp; không đi vào khu vực hạn chế.</Text>}
          {nav.rerouted && <Text style={ui.muted}>Đang sử dụng tuyến thay thế do hạn chế hoặc ùn tắc.</Text>}
          {nav.status === "available" && !exited && <View style={ui.row}>
            <Text style={{ color: "white", fontWeight: "700" }}>{nav.distanceMeters ?? "—"} m · {nav.estimatedSeconds == null ? "—" : Math.max(1, Math.ceil(nav.estimatedSeconds / 60))} phút dự kiến</Text>
            <Text style={ui.muted}>Bản đồ {nav.mapVersion || "—"}</Text>
          </View>}
        </View>}
        <YardRouteMap route={route} stale={!!error} />
        {nav?.status === "available" && !error && !exited && <View style={ui.card}>
          <Text style={ui.title}>Hướng dẫn di chuyển</Text>
          {nav.directions.map((step, index) => <View key={`${index}-${step}`} style={{ flexDirection: "row", gap: 10 }}><Text style={{ color: "#ff922e", width: 18, fontWeight: "700" }}>{index + 1}</Text><Text style={[ui.text, { flex: 1 }]}>{step}</Text></View>)}
        </View>}
        <View style={ui.card}>
          <Text style={ui.title}>Trạng thái xe · điều độ cùng theo dõi</Text>
          {[["Cổng xác nhận vào", journey?.gateInAt], ["Đến điểm giao nhận", journey?.arrivedAt], ["Xác nhận container", journey?.containerConfirmedAt], ["Cổng xác nhận ra", journey?.gateOutAt]].map(([label, time]) => <View key={label} style={ui.row}><Text style={ui.text}>{label}</Text><Text style={[ui.muted, { color: time ? "#8cdcb0" : "#909090" }]}>{clock(time)}</Text></View>)}
          <Text style={ui.muted}>Tuyến xác nhận lúc {clock(nav?.generatedAt)}. Xe phải tuân theo hướng dẫn của nhân viên cổng và Yard.</Text>
        </View>
        {journey?.canArrive && <TouchableOpacity accessibilityRole="button" disabled={!enabled} style={[styles.primary, !enabled && styles.disabled]} onPress={() => Alert.alert("Đã đến đúng điểm giao nhận?", destination || "Xác nhận vị trí theo Operation Order.", [{ text: "Chưa đến", style: "cancel" }, { text: "Đã đến", onPress: () => void execute("arrive") }])}>
          {actionLoading ? <ActivityIndicator color="white" /> : <Text style={styles.primaryText}>Xác nhận đã đến điểm giao nhận</Text>}
        </TouchableOpacity>}
        {journey?.phase === "at_yard" && <View style={ui.card}>
          <Text style={ui.title}>{journey.containerConfirmedAt ? "Đã ghi nhận giao nhận container" : journey.canConfirmContainer ? "Yard đã xử lý xong container" : "Chờ Yard hoàn tất xử lý"}</Text>
          <Text style={ui.text}>{journey.containerConfirmedAt ? "Chờ hoàn tất các container còn lại trong booking hoặc hướng dẫn từ điều độ. Tuyến đến cổng ra sẽ tự cập nhật khi đủ điều kiện." : journey.canConfirmContainer ? "Kiểm tra đúng số container và tình trạng trước khi xác nhận giao nhận." : "Trạng thái sẽ tự cập nhật khi Yard hoàn tất Operation Order."}</Text>
          {journey.canConfirmContainer && <TouchableOpacity disabled={!enabled} style={[styles.primary, !enabled && styles.disabled]} onPress={() => { setCondition("OK"); setShowConfirmation(true); }}><Text style={styles.primaryText}>Kiểm tra & xác nhận container</Text></TouchableOpacity>}
        </View>}
        {journey?.phase === "ready_for_gate_out" && <View style={ui.card}><Text style={{ color: "#8cdcb0", lineHeight: 21 }}>Di chuyển đến {journey.exitGateCode || "cổng ra được chỉ định"}. Chờ nhân viên cổng kiểm tra và xác nhận xe ra bãi.</Text></View>}
      </>}
    </ScrollView>
    <Modal visible={showConfirmation} transparent animationType="slide" onRequestClose={() => { if (!actionLoading) setShowConfirmation(false); }}>
      <View style={{ flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#000b" }}>
        <View style={[ui.card, { backgroundColor: "#17232f", borderColor: "#46617a" }]}>
          <Text style={ui.title}>Xác nhận {route?.containerNumber}</Text>
          <Text style={ui.text}>Tình trạng container khi giao nhận</Text>
          {([ ["OK", "Tốt / đúng yêu cầu"], ["DAMAGED", "Có hư hỏng"], ["ISSUE", "Có vấn đề khác"] ] as const).map(([value, label]) => <TouchableOpacity key={value} disabled={actionLoading} onPress={() => setCondition(value)} style={[styles.chip, { borderColor: condition === value ? "#ff922e" : "#334154" }]}><Text style={ui.text}>{condition === value ? "● " : "○ "}{label}</Text></TouchableOpacity>)}
          <TextInput value={notes} onChangeText={setNotes} editable={!actionLoading} maxLength={1000} multiline placeholder="Ghi chú giao nhận (tối đa 1.000 ký tự)" placeholderTextColor="#8c9cab" style={{ color: "white", backgroundColor: "#0e1822", borderRadius: 10, padding: 12, minHeight: 85 }} />
          <TouchableOpacity disabled={!enabled || !journey?.canConfirmContainer} style={[styles.primary, (!enabled || !journey?.canConfirmContainer) && styles.disabled]} onPress={() => void execute("confirm")}>{actionLoading ? <ActivityIndicator color="white" /> : <Text style={styles.primaryText}>Xác nhận giao nhận container</Text>}</TouchableOpacity>
          <TouchableOpacity disabled={actionLoading} onPress={() => setShowConfirmation(false)}><Text style={{ color: "#b9c9d7", textAlign: "center", padding: 10 }}>Quay lại</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  </View>;
}

const styles = StyleSheet.create({
  chip: { padding: 10, borderRadius: 10, borderWidth: 1, backgroundColor: "#13202e" },
  primary: { padding: 16, borderRadius: 14, backgroundColor: "#d96d22", alignItems: "center" },
  primaryText: { color: "white", fontWeight: "700", fontSize: 14, textAlign: "center" },
  disabled: { opacity: .45 },
});
