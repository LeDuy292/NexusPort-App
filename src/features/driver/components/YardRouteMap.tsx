import { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { SmartRoute, YardMap, YardNode } from "../services/smartRouteService";
import type { JourneyStage } from '../journeyPresentation';

/** Map geometry comes only from the approved yard map. It is never inferred from GPS. */
export function YardRouteMap({ route, map, stage = 'to_yard', stale = false }: { route?: SmartRoute | null; map?: YardMap | null; stage?: JourneyStage; stale?: boolean }) {
  const [width, setWidth] = useState(320);
  const [zoomed, setZoomed] = useState(false);
  const navigation = route?.navigation;
  const approvedMap = navigation?.map || map;
  const nodes = approvedMap?.nodes || navigation?.waypoints || [];
  if (!nodes.length) return <View style={styles.empty}><Text style={styles.muted}>Chưa có sơ đồ bãi được xác nhận.</Text></View>;
  const layout = approvedMap?.layout;
  const blocks = layout?.blocks || [];
  const left = Math.min(...nodes.map(node => node.x), ...blocks.map(block => block.x));
  const top = Math.min(...nodes.map(node => node.y), ...blocks.map(block => block.y)) - 55;
  const spanX = Math.max(1, Math.max(...nodes.map(node => node.x), ...blocks.map(block => block.x + block.width)) - left);
  const spanY = Math.max(1, Math.max(...nodes.map(node => node.y), ...blocks.map(block => block.y + block.height)) - top);
  const mapWidth = zoomed ? Math.max(width, 680) : Math.max(width, 350);
  const mapHeight = Math.max(360, Math.min(640, (mapWidth - 100) * spanY / spanX + 100));
  const scale = Math.min((mapWidth - 100) / spanX, (mapHeight - 100) / spanY);
  const project = (node: { x: number; y: number }) => ({ x: 50 + (node.x - left) * scale, y: 50 + (node.y - top) * scale });
  const nodeLookup = new Map(nodes.map(node => [node.id, node]));
  const entrance = nodes.find(node => node.gateCode === 'GATE-01');
  const exit = nodes.find(node => node.gateCode === (route?.journey?.exitGateCode || 'GATE-03'));
  const marker = stage === 'ready' && entrance ? { ...entrance, y: entrance.y - 45 }
    : stage === 'gate_in' ? entrance
      : ['completed', 'gate_out'].includes(stage) ? exit
        : nodeLookup.get(route?.journey?.currentNodeId || '') || navigation?.origin;
  const markerLabel = stage === 'ready' ? 'Xe · khu chờ ngoài cổng' : stage === 'gate_in' ? 'Xe · chờ Gate In'
    : stage === 'handover' ? 'Xe · điểm giao nhận' : stage === 'completed' ? 'Xe · đã rời cảng'
      : stage === 'to_exit' ? 'Xe · mốc xuất phát ra cổng' : stage === 'gate_out' ? 'Xe · cổng ra' : 'Xe · mốc đã xác nhận';
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
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 }}><Text style={styles.muted}>{zoomed ? 'Chi tiết sơ đồ' : 'Toàn cảnh bãi'}</Text><TouchableOpacity accessibilityRole="button" onPress={() => setZoomed(value => !value)}><Text style={{ color: '#1d6c56', fontWeight: '700', fontSize: 12 }}>{zoomed ? 'Thu gọn' : 'Phóng to'}</Text></TouchableOpacity></View>
    <ScrollView horizontal showsHorizontalScrollIndicator>
      <View accessible accessibilityLabel={`Sơ đồ bãi 2D. ${markerLabel}. Tuyến từ ${navigation?.origin?.label || "cổng"} đến ${navigation?.destinationNode?.label || "điểm được phân công"}`} style={{ width: mapWidth, height: mapHeight, backgroundColor: "#ffffff" }}>
        <Text style={{ position: "absolute", top: 12, left: 16, color: "#71879b", fontSize: 10 }}>BẮC · KHU CHỜ NGOÀI BÃI</Text>
        {(approvedMap?.edges || []).filter(edge => !nodeLookup.get(edge.from)?.slotId && !nodeLookup.get(edge.to)?.slotId).map(edge => line(`road-${edge.id}`, nodeLookup.get(edge.from), nodeLookup.get(edge.to), edge.restricted ? "#e07a85" : (edge.congestion || 0) >= .5 ? "#eab84c" : "#e2e8ee", 14, true))}
        {blocks.map(block => {
          const p = project(block);
          const blockWidth = Math.max(60, block.width * scale), blockHeight = Math.max(50, block.height * scale);
          const slots = layout?.slots?.filter(slot => slot.block === block.code) || [];
          return <View key={block.code} style={{ position: "absolute", left: p.x, top: p.y, width: blockWidth, height: blockHeight, padding: 5, backgroundColor: "#eff5f2", borderWidth: 1, borderColor: "#d8e6df", borderRadius: 5 }}>
            <Text style={{ color: "#334155", fontSize: 10, textAlign: "center", marginBottom: 4 }}>{block.label} · {block.bays} × {block.rows} × {block.tiers}</Text>
            {Array.from({ length: block.rows }, (_, rowIndex) => <View key={rowIndex} style={{ flexDirection: "row", flex: 1, gap: 2, marginBottom: 2 }}>
              {Array.from({ length: block.bays }, (_, bayIndex) => {
                const stack = slots.filter(slot => slot.row === rowIndex + 1 && slot.bay === bayIndex + 1);
                const occupied = stack.filter(slot => slot.status === "occupied").length;
                const target = route?.target?.block === block.code && route.target.row === rowIndex + 1 && route.target.bay === bayIndex + 1;
                return <View key={bayIndex} style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: target ? "#ffedd5" : occupied ? "#bdd7ca" : "#ffffff", borderWidth: target ? 2 : 0, borderColor: "#c45b22" }}>
                  <Text style={{ color: target ? "#9a431b" : "#475569", fontSize: 9 }}>{occupied}/{block.tiers}</Text>
                </View>;
              })}
            </View>)}
          </View>;
        })}
        {!stale && !['ready', 'gate_in', 'completed'].includes(stage) && navigation?.status === "available" && navigation.segments.map((edge, index) => line(`route-${index}`, nodeLookup.get(edge.from) || navigation.waypoints.find(node => node.id === edge.from), nodeLookup.get(edge.to) || navigation.waypoints.find(node => node.id === edge.to), "#c45b22", 4, true))}
        {nodes.filter(node => (!node.slotId && (node.gateCode || node.blockCode || node.location)) || node.id === navigation?.origin?.id || node.id === navigation?.destinationNode?.id).map(node => {
          const p = project(node), origin = node.id === navigation?.origin?.id, destination = node.id === navigation?.destinationNode?.id;
          return <View key={node.id} style={{ position: "absolute", left: p.x - 8, top: p.y - 8, alignItems: "center", width: 16 }}>
            <View style={{ width: origin || destination ? 16 : 10, height: origin || destination ? 16 : 10, borderRadius: 8, borderWidth: 2, borderColor: "#fff", backgroundColor: node.restricted ? "#be3344" : destination ? "#c45b22" : "#94a3b8" }} />
            <Text numberOfLines={2} style={{ color: "#334155", fontSize: 10, textAlign: "center", width: 95, marginTop: 3, backgroundColor: "#fffffff0" }}>{node.label}</Text>
          </View>;
        })}
        {marker && <View style={{ position: 'absolute', left: project(marker).x - 10, top: project(marker).y - 24, alignItems: 'center', width: 20 }}>
          <View style={{ backgroundColor: stale ? '#64748b' : '#1d6c56', borderRadius: 9, padding: 5, borderWidth: 2, borderColor: '#fff' }}><Text style={{ fontSize: 18 }}>🚛</Text></View>
          <Text style={{ width: 145, fontSize: 10, fontWeight: '700', textAlign: 'center', color: '#145540', backgroundColor: '#f0fdf4', padding: 4, borderRadius: 4 }}>{stale ? 'Vị trí lần cập nhật trước' : markerLabel}</Text>
        </View>}
      </View>
    </ScrollView>
    <Text style={styles.legend}>🚛 Xe · Cam: tuyến được phân công · Đỏ: hạn chế</Text>
    <Text style={styles.muted}>{zoomed ? 'Vuốt ngang để xem chi tiết. ' : ''}Vị trí theo mốc xác nhận, không phải GPS.</Text>
  </View>;
}

const styles = StyleSheet.create({
  frame: { borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: "#e2e8f0", gap: 8, paddingBottom: 12, backgroundColor: "#fff" },
  empty: { padding: 25, borderRadius: 12, backgroundColor: "#fff" },
  legend: { color: "#475569", fontSize: 11, paddingHorizontal: 12 },
  muted: { color: "#64748b", fontSize: 11, lineHeight: 17, paddingHorizontal: 12 },
});
