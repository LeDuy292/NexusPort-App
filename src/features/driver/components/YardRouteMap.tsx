import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { SmartRoute, YardNode } from "../services/smartRouteService";

/** Map geometry comes only from the approved yard map. It is never inferred from GPS. */
export function YardRouteMap({ route, stale = false }: { route: SmartRoute; stale?: boolean }) {
  const [width, setWidth] = useState(320);
  const navigation = route.navigation;
  const nodes = navigation?.map?.nodes || navigation?.waypoints || [];
  if (!nodes.length) return <View style={styles.empty}><Text style={styles.muted}>Chưa có sơ đồ bãi được xác nhận.</Text></View>;
  const layout = navigation?.map?.layout;
  const blocks = layout?.blocks || [];
  const left = Math.min(...nodes.map(node => node.x), ...blocks.map(block => block.x));
  const top = Math.min(...nodes.map(node => node.y), ...blocks.map(block => block.y));
  const spanX = Math.max(1, Math.max(...nodes.map(node => node.x), ...blocks.map(block => block.x + block.width)) - left);
  const spanY = Math.max(1, Math.max(...nodes.map(node => node.y), ...blocks.map(block => block.y + block.height)) - top);
  const mapWidth = Math.max(width, 570);
  const mapHeight = Math.max(360, Math.min(640, (mapWidth - 100) * spanY / spanX + 100));
  const scale = Math.min((mapWidth - 100) / spanX, (mapHeight - 100) / spanY);
  const project = (node: { x: number; y: number }) => ({ x: 50 + (node.x - left) * scale, y: 50 + (node.y - top) * scale });
  const nodeLookup = new Map(nodes.map(node => [node.id, node]));
  const line = (id: string, a: YardNode | undefined, b: YardNode | undefined, color: string, thickness: number, arrow = false) => {
    if (!a || !b) return null;
    const from = project(a), to = project(b);
    const distance = Math.hypot(to.x - from.x, to.y - from.y);
    const angle = Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI;
    return <View key={id} pointerEvents="none">
      <View style={{ position: "absolute", left: (from.x + to.x) / 2 - distance / 2, top: (from.y + to.y) / 2 - thickness / 2, width: distance, height: thickness, backgroundColor: color, borderRadius: thickness / 2, transform: [{ rotate: `${angle}deg` }] }} />
      {arrow && distance > 25 && <Text style={{ position: "absolute", left: (from.x + to.x) / 2 - 7, top: (from.y + to.y) / 2 - 11, color, fontSize: 18, fontWeight: "900", transform: [{ rotate: `${angle}deg` }] }}>›</Text>}
    </View>;
  };
  return <View style={styles.frame} onLayout={event => setWidth(event.nativeEvent.layout.width)}>
    <ScrollView horizontal showsHorizontalScrollIndicator>
      <View accessible accessibilityLabel={`Sơ đồ tuyến từ ${navigation?.origin?.label || "cổng"} đến ${navigation?.destinationNode?.label || "điểm được phân công"}`} style={{ width: mapWidth, height: mapHeight, backgroundColor: "#101c29" }}>
        <Text style={{ position: "absolute", top: 12, left: 16, color: "#71879b", fontSize: 10 }}>BẮC · KHU CHỜ NGOÀI BÃI</Text>
        {(navigation?.map?.edges || []).filter(edge => !nodeLookup.get(edge.from)?.slotId && !nodeLookup.get(edge.to)?.slotId).map(edge => line(`road-${edge.id}`, nodeLookup.get(edge.from), nodeLookup.get(edge.to), edge.restricted ? "#a84854" : (edge.congestion || 0) >= .5 ? "#a97827" : "#304355", 12))}
        {blocks.map(block => {
          const p = project(block);
          const blockWidth = Math.max(60, block.width * scale), blockHeight = Math.max(50, block.height * scale);
          const slots = layout?.slots?.filter(slot => slot.block === block.code) || [];
          return <View key={block.code} style={{ position: "absolute", left: p.x, top: p.y, width: blockWidth, height: blockHeight, padding: 5, backgroundColor: "#182e37", borderWidth: 1, borderColor: "#37545c", borderRadius: 5 }}>
            <Text style={{ color: "#c2d1db", fontSize: 10, textAlign: "center", marginBottom: 4 }}>{block.label} · {block.bays} × {block.rows} × {block.tiers}</Text>
            {Array.from({ length: block.rows }, (_, rowIndex) => <View key={rowIndex} style={{ flexDirection: "row", flex: 1, gap: 2, marginBottom: 2 }}>
              {Array.from({ length: block.bays }, (_, bayIndex) => {
                const stack = slots.filter(slot => slot.row === rowIndex + 1 && slot.bay === bayIndex + 1);
                const occupied = stack.filter(slot => slot.status === "occupied").length;
                const target = route.target?.block === block.code && route.target.row === rowIndex + 1 && route.target.bay === bayIndex + 1;
                return <View key={bayIndex} style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: target ? "#bc672d" : occupied ? "#325a50" : "#223b42", borderWidth: target ? 1 : 0, borderColor: "#ffb363" }}>
                  <Text style={{ color: target ? "#fff" : "#b0cbc4", fontSize: 8 }}>{occupied}/{block.tiers}</Text>
                </View>;
              })}
            </View>)}
          </View>;
        })}
        {!stale && navigation?.status === "available" && navigation.segments.map((edge, index) => line(`route-${index}`, nodeLookup.get(edge.from) || navigation.waypoints.find(node => node.id === edge.from), nodeLookup.get(edge.to) || navigation.waypoints.find(node => node.id === edge.to), "#ff922e", 4, true))}
        {nodes.filter(node => (!node.slotId && (node.gateCode || node.blockCode || node.location)) || node.id === navigation?.origin?.id || node.id === navigation?.destinationNode?.id).map(node => {
          const p = project(node), origin = node.id === navigation?.origin?.id, destination = node.id === navigation?.destinationNode?.id;
          return <View key={node.id} style={{ position: "absolute", left: p.x - 8, top: p.y - 8, alignItems: "center", width: 16 }}>
            <View style={{ width: origin || destination ? 16 : 10, height: origin || destination ? 16 : 10, borderRadius: 8, borderWidth: 2, borderColor: "#101c29", backgroundColor: node.restricted ? "#ef6977" : origin ? "#48cc9a" : destination ? "#ffad58" : "#bdd5e3" }} />
            <Text numberOfLines={2} style={{ color: "#deebf4", fontSize: 9, textAlign: "center", width: 95, marginTop: 3, backgroundColor: "#101c29d9" }}>{origin ? "Xe · " : ""}{node.label}</Text>
          </View>;
        })}
      </View>
    </ScrollView>
    <Text style={styles.legend}>● Xe: xanh · Đích: cam · Cấm: đỏ · Ùn tắc: vàng</Text>
    <Text style={styles.muted}>Vuốt ngang để xem bãi. Vị trí theo mốc xác nhận, không phải GPS.</Text>
  </View>;
}

const styles = StyleSheet.create({
  frame: { borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: "#314254", gap: 8, paddingBottom: 10, backgroundColor: "#101c29" },
  empty: { padding: 25, borderRadius: 12, backgroundColor: "#101c29" },
  legend: { color: "#c7d6e2", fontSize: 11, paddingHorizontal: 12 },
  muted: { color: "#91a6b8", fontSize: 11, lineHeight: 17, paddingHorizontal: 12 },
});
