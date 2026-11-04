import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SvgXml } from "react-native-svg";
import plan from "../data/tienSaPlan.json";
import type { SmartRoute, YardMap } from "../services/smartRouteService";
export function YardRouteMap({
  route,
  map,
  stale = false,
}: {
  route?: SmartRoute | null;
  map?: YardMap | null;
  stale?: boolean;
}) {
  const [zoom, setZoom] = useState(1);
  const navigation = route?.navigation,
    active = navigation?.map || map;
  const mismatch =
    navigation?.status === "available" &&
    active?.terminalPlan?.version !== plan.version;
  const points =
    !stale &&
    navigation?.status === "available" &&
    active?.terminalPlan?.version === plan.version
      ? navigation.waypoints
      : [];
  const safe = points.every(
    (p) => Number.isFinite(p.x) && Number.isFinite(p.y),
  );
  const overlay =
    safe && points.length
      ? `<g transform="rotate(-37.674)"><polyline points="${points.map((p) => `${p.x},${p.y}`).join(" ")}" fill="none" stroke="#df762f" stroke-width="6"/><circle cx="${points[0].x}" cy="${points[0].y}" r="9" fill="#276eaa"/><circle cx="${points[points.length - 1].x}" cy="${points[points.length - 1].y}" r="9" fill="#df762f"/></g>`
      : "";
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="260 270 1490 970">${plan.svg}${overlay}</svg>`;
  return (
    <View
      style={{
        backgroundColor: "#f8fbfc",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          padding: 12,
        }}
      >
        <Text style={{ fontWeight: "700" }}>Cảng Tiên Sa</Text>
        <TouchableOpacity onPress={() => setZoom(zoom === 1 ? 2 : 1)}>
          <Text>{zoom === 1 ? "Phóng to" : "Vừa khung"}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal nestedScrollEnabled>
        <SvgXml xml={xml} width={520 * zoom} height={340 * zoom} />
      </ScrollView>
      {stale && (
        <Text style={{ padding: 10, color: "#8a6b2f" }}>
          Đang chờ cập nhật lộ trình.
        </Text>
      )}
      {mismatch && (
        <Text style={{ padding: 10, color: "#8a6b2f" }}>
          Lệnh này dùng phiên bản bản đồ khác. Chưa thể hiển thị đường đi trên
          mặt bằng mới.
        </Text>
      )}
    </View>
  );
}
