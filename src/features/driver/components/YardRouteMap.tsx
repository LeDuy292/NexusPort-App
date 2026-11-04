import { StyleSheet, Text, View } from 'react-native';
import type { SmartRoute, YardMap, ReferenceYardLayout } from '../services/smartRouteService';
import type { JourneyStage } from '../journeyPresentation';
import { YardLayoutPlan } from './YardLayoutPlan';

/** Render only the shared yard drawing, never the retired route-map view. */
export function YardRouteMap({ route, map, referenceLayout, stage = 'to_yard', stale = false }: { route?: SmartRoute | null; map?: YardMap | null; referenceLayout?: ReferenceYardLayout | null; stage?: JourneyStage; stale?: boolean }) {
  const approvedMap = route?.navigation?.map || map;
  const plan = approvedMap?.referenceLayout || referenceLayout;
  if (!plan) return <View style={styles.empty}><Text style={styles.muted}>Chưa tải được sơ đồ bãi. Vui lòng cập nhật lại.</Text></View>;
  return <View style={styles.frame}><YardLayoutPlan plan={plan} route={route} map={approvedMap} stage={stage} stale={stale} /></View>;
}

const styles = StyleSheet.create({
  frame: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#bac8d7', backgroundColor: '#fff' },
  empty: { padding: 25, borderRadius: 12, backgroundColor: '#fff' },
  muted: { color: '#52647b', fontSize: 12, lineHeight: 18 },
});
