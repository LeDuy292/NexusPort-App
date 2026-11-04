import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { ReferenceYardLayout, SmartRoute, YardMap } from '../services/smartRouteService';
import type { JourneyStage } from '../journeyPresentation';

const colors: Record<string, string> = { A: '#185bb8', B: '#006b73', C: '#7546a7', D: '#40546f', S: '#a65300' };

/** Proposed geometry is deliberately separate from the operational route map. */
export function YardLayoutPlan({ plan, route, map, stage='to_yard', stale=false }: { plan: ReferenceYardLayout; route?: SmartRoute | null; map?: YardMap | null; stage?: JourneyStage; stale?: boolean }) {
  const [selectedCode, setSelectedCode] = useState('A1');
  const selected = plan.areas.find(area => area.code === selectedCode);
  const scale = .78, width = plan.width * scale, height = plan.height * scale;
  const operational=map?.layout?.drawingVersion===plan.version;
  const points=operational&&!stale&&!['ready','gate_in','completed'].includes(stage)&&route?.navigation?.status==='available'?route.navigation.waypoints:[];
  const gate=map?.nodes.find(n=>n.gateCode===(['completed','gate_out'].includes(stage)?route?.journey?.exitGateCode||'GATE-02':route?.gateCode||'GATE-01'));
  const marker=operational?(['ready','gate_in','completed','gate_out'].includes(stage)?gate:map?.nodes.find(n=>n.id===route?.journey?.currentNodeId)||route?.navigation?.origin):null;
  const line = (key: string, a: number[], b: number[], route = false) => {
    const ax=a[0]*scale, ay=a[1]*scale, bx=b[0]*scale, by=b[1]*scale;
    const length=Math.hypot(bx-ax,by-ay), angle=Math.atan2(by-ay,bx-ax)*180/Math.PI;
    const thickness=route?4:22;
    return <View key={key} pointerEvents="none" style={{ position:'absolute', left:(ax+bx)/2-length/2, top:(ay+by)/2-thickness/2, width:length, height:thickness, backgroundColor:route?'#c45b22':'#e5ebf2', transform:[{rotate:`${angle}deg`}] }} />;
  };
  return <View style={styles.frame}>
    <Text style={styles.heading}>Sơ đồ bãi container</Text><Text style={styles.note}>{operational?'Sơ đồ bãi đang sử dụng':'Phương án bố trí bãi'} · 1 cổng vào / 1 cổng ra · Không theo tỷ lệ thực tế</Text>
    <View style={styles.legend}>{plan.zones.map(zone => <View key={zone.code} style={styles.legendItem}><View style={{width:10,height:10,backgroundColor:colors[zone.code]}} /><Text style={styles.legendText}>{zone.code} · {zone.label}</Text></View>)}</View>
    <ScrollView horizontal showsHorizontalScrollIndicator nestedScrollEnabled>
      <View style={{width,height,backgroundColor:'#fff'}} accessibilityLabel="Sơ đồ bãi container dự kiến. Chọn khu vực để xem mã vị trí trong bản gốc.">
        <View style={{position:'absolute',left:18*scale,top:98*scale,width:964*scale,height:970*scale,borderWidth:1,borderColor:'#bac8d7'}} />
        <Text style={{position:'absolute',left:40*scale,top:25*scale,fontSize:12,fontWeight:'700',color:'#14243b'}}>ĐƯỜNG VÀO BÃI</Text>
        {plan.roads.flatMap(road => road.points.slice(1).map((point,i)=>line(`${road.id}-${i}`,road.points[i],point)))}
        {[300,600,900].flatMap(y=>[<Text key={`in-${y}`} style={{position:'absolute',left:691*scale-7,top:y*scale-12,color:'#006b73',fontSize:22}}>↓</Text>,<Text key={`out-${y}`} style={{position:'absolute',left:949*scale-7,top:y*scale-12,color:'#006b73',fontSize:22}}>↑</Text>])}
        <Text style={{position:'absolute',left:810*scale,top:962*scale-15,color:'#006b73',fontSize:22}}>→</Text>
        {plan.facilities.map(facility=><View key={facility.code} style={{position:'absolute',left:facility.x*scale,top:facility.y*scale,width:facility.width*scale,height:facility.height*scale,alignItems:'center',justifyContent:'center',backgroundColor:'#f1f5f9',borderWidth:1,borderColor:'#94a3b8'}}><Text style={{fontSize:facility.code==='light'?10:11,color:'#334155',textAlign:'center'}}>{facility.code==='light'?'Đèn':facility.label}</Text></View>)}
        {plan.areas.map(area=><TouchableOpacity key={area.code} accessibilityRole="button" accessibilityLabel={`${area.code}, ${area.note || area.zone}`} accessibilityState={{selected:selectedCode===area.code}} onPress={()=>setSelectedCode(area.code)} style={{position:'absolute',left:area.x*scale,top:area.y*scale,width:area.width*scale,height:area.height*scale,alignItems:'center',justifyContent:'center',backgroundColor:colors[area.zone]+'18',borderWidth:selectedCode===area.code?2:1,borderColor:selectedCode===area.code?'#14243b':colors[area.zone],borderRadius:2}}><Text style={{color:'#14243b',fontSize:12,fontWeight:'700'}}>{area.code}</Text></TouchableOpacity>)}
        {points.slice(1).map((point,i)=>line(`assigned-${i}`,[points[i].x,points[i].y],[point.x,point.y],true))}
        {marker && <View accessibilityLabel="Xe tại vị trí đã được xác nhận gần nhất" style={{position:'absolute',left:marker.x*scale-8,top:marker.y*scale-8,width:16,height:16,backgroundColor:stale?'#64748b':'#185bb8',borderRadius:8,borderWidth:2,borderColor:'#fff'}} />}
        {plan.gates.map(gate=><View key={gate.code} style={{position:'absolute',left:(gate.x-42)*scale,top:(gate.y-16)*scale,width:84*scale,alignItems:'center',backgroundColor:'#fff',borderWidth:1,borderColor:'#006b73',borderStyle:'dashed'}}><Text style={{fontSize:11,fontWeight:'700',color:'#14243b'}}>{gate.label} {gate.direction==='in'?'↓':'↑'}</Text><Text style={{fontSize:10,color:'#52647b'}}>{gate.code}</Text></View>)}
        <Text style={{position:'absolute',left:460*scale,top:1040*scale,color:'#14243b',fontSize:12,fontWeight:'700'}}>KHU D</Text>
      </View>
    </ScrollView>
    {selected && <View accessibilityLiveRegion="polite" style={styles.selection}><Text style={styles.selected}>{selected.code} · {selected.note || 'Chưa có ghi chú trong bản gốc'}</Text><View style={styles.legend}>{selected.rows.map(row=><Text key={row} style={styles.position}>{selected.code}-{row}</Text>)}</View>{selected.sourceHighlight && <Text style={styles.note}>Được đánh dấu đỏ trong bản gốc; chưa có giải thích về ý nghĩa vận hành.</Text>}</View>}
    <Text style={styles.note}>Vuốt ngang để xem toàn bộ sơ đồ. {operational?'Cam: tuyến được chỉ định. Xanh dương: vị trí xe được xác nhận gần nhất, không phải GPS.':'Vị trí cổng và luồng xe dự kiến chưa thay thế tuyến được chỉ định.'}</Text>
  </View>;
}

const styles=StyleSheet.create({frame:{backgroundColor:'#fff',gap:10,paddingVertical:12},heading:{fontSize:16,fontWeight:'700',color:'#14243b',paddingHorizontal:12},note:{fontSize:12,color:'#52647b',lineHeight:18,paddingHorizontal:12},legend:{flexDirection:'row',flexWrap:'wrap',gap:8,paddingHorizontal:12},legendItem:{flexDirection:'row',alignItems:'center',gap:5},legendText:{fontSize:12,color:'#14243b'},selection:{gap:8,paddingTop:8},selected:{fontSize:13,fontWeight:'700',color:'#14243b',paddingHorizontal:12},position:{fontSize:12,color:'#14243b',borderWidth:1,borderColor:'#bac8d7',borderRadius:4,padding:6}});
