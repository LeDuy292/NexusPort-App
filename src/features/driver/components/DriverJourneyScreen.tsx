import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../auth/AuthProvider';
import { useBookings } from '../../bookings/BookingProvider';
import { BookingFeedState, ui } from '../../bookings/components/BookingUI';
import { DriverArrivalCard } from '../../bookings/components/DriverArrivalCard';
import { bookingTime, bookingTypeLabel } from '../../bookings/bookingPresentation';
import { JOURNEY_STAGES, bookingJourneyNotice, containerProgress, currentJourneyStage, journeyStageState, stageTimestamp, type JourneyStage } from '../journeyPresentation';
import { useDriverJourney } from '../useDriverJourney';
import { arriveAtDestination, confirmYardContainer } from '../services/smartRouteService';
import { YardRouteMap } from './YardRouteMap';

export default function DriverJourneyScreen() {
  const params = useLocalSearchParams<{ bookingId?: string; containerId?: string }>();
  const { user } = useAuth();
  const { feed, loading: feedLoading, error: feedError, reload: reloadBookings } = useBookings();
  const [bookingId, setBookingId] = useState(params.bookingId || '');
  const [containerId, setContainerId] = useState(params.containerId || '');
  const [viewStage, setViewStage] = useState<JourneyStage | null>(null);
  const [modal, setModal] = useState<'details' | 'confirm' | 'arrive' | 'map' | null>(null);
  const [condition, setCondition] = useState<'OK' | 'DAMAGED' | 'ISSUE'>('OK');
  const [notes, setNotes] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const actionPending = useRef(false);
  const timeline = useRef<ScrollView>(null);
  const bookings = feed?.bookings || [];
  const booking = bookings.find(item => item.id === bookingId);
  const container = booking?.containers.find(item => item.id === containerId) || (!containerId ? booking?.containers[0] : undefined);
  const journey = useDriverJourney(booking?.id, container?.id);
  const route = journey.route;
  const progress = route?.journey;
  const notice = booking ? bookingJourneyNotice(booking) : null;
  const containers = booking ? containerProgress(booking, journey.routes) : null;
  const current = currentJourneyStage(booking, route);
  const selected = viewStage || current;
  const step = JOURNEY_STAGES.find(item => item.id === selected)!;
  const stepState = notice ? 'pending' : journeyStageState(selected, current);
  const currentIndex = JOURNEY_STAGES.findIndex(item => item.id === current);
  const selectedTime = stageTimestamp(selected, booking, route);
  const fresh = !notice && !feedError && !journey.error && !journey.loading && !journey.refreshing && !acting;
  const canCoordinate = !notice && !feedError && !feedLoading && !acting;
  const isCurrent = selected === current;
  const target = route?.target?.location;
  const previousStage = useRef(current);
  const refresh = async () => { await Promise.all([reloadBookings(), journey.reload()]); };

  useEffect(() => {
    if (!bookingId && bookings.length) {
      const next = bookings.find(item => ['checked_in', 'checkedin'].includes(item.status.toLowerCase()))
        || bookings.find(item => ['approved', 'ready'].includes(item.status.toLowerCase())) || bookings[0];
      setBookingId(next.id);
    }
  }, [bookings, bookingId]);
  useEffect(() => {
    if (params.bookingId) { setBookingId(params.bookingId); setContainerId(params.containerId || ''); }
  }, [params.bookingId, params.containerId]);
  useEffect(() => { setViewStage(null); setActionError(null); setModal(null); }, [bookingId, container?.id]);
  useEffect(() => {
    const previous = previousStage.current;
    setViewStage(value => value === previous ? current : value);
    previousStage.current = current;
    timeline.current?.scrollTo({ x: Math.max(0, (currentIndex - 1) * 96), animated: true });
  }, [current, currentIndex]);
  useEffect(() => {
    if (!acting && ((modal === 'arrive' && !progress?.canArrive) || (modal === 'confirm' && !progress?.canConfirmContainer))) setModal(null);
  }, [modal, acting, progress?.canArrive, progress?.canConfirmContainer]);

  const execute = async (action: 'arrive' | 'confirm') => {
    if (!route || !fresh || !isCurrent || actionPending.current) return;
    if (action === 'arrive' && !progress?.canArrive || action === 'confirm' && !progress?.canConfirmContainer) return;
    if (action === 'confirm' && condition !== 'OK' && !notes.trim()) return;
    actionPending.current = true; setActing(true); setActionError(null);
    try {
      await journey.mutate(() => action === 'arrive' ? arriveAtDestination(route) : confirmYardContainer(route, condition, notes));
      setModal(null); setNotes('');
      await reloadBookings();
    } catch (err) { setActionError(err instanceof Error ? err.message : 'Chưa cập nhật được. Thử lại.'); }
    finally { actionPending.current = false; setActing(false); }
  };

  const button = (label: string, onPress: () => void, disabled = false) => <TouchableOpacity accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.primary, disabled && { opacity: .45 }]}>
    <Text style={styles.primaryText}>{acting ? 'Đang cập nhật…' : label}</Text>
  </TouchableOpacity>;
  const map = <YardRouteMap route={route} map={journey.map} stage={current} stale={!!journey.error || !!feedError || !!journey.mapWarning} />;

  return <View style={ui.page}>
    <View style={styles.header}>
      <View style={{ flex: 1 }}><Text style={styles.eyebrow}>NEXUSPORT / TÀI XẾ</Text><Text style={styles.heading}>Hành trình của bạn</Text><Text style={ui.muted}>Xin chào, {feed?.profile?.fullName || user?.fullName || user?.username}</Text></View>
      <TouchableOpacity accessibilityLabel="Thông báo" onPress={() => router.push('/(driver)/notifications')} style={styles.iconButton}><Ionicons name="notifications-outline" size={22} color="#172b3a" /></TouchableOpacity>
    </View>
    <ScrollView contentContainerStyle={[ui.content, { paddingTop: 8 }]} refreshControl={<RefreshControl refreshing={journey.refreshing || feedLoading} onRefresh={() => void refresh()} tintColor="#1d6c56" />}>
      <BookingFeedState />
      {feed && !booking && <View style={ui.card}><Text style={ui.title}>{bookingId ? 'Không tìm thấy booking được chọn' : 'Chưa có hành trình được giao'}</Text><Text style={ui.text}>Chọn một booking của bạn để xem các chặng và hướng dẫn thực hiện.</Text>{button('Xem booking được giao', () => router.push('/(driver)/bookings'))}</View>}
      {bookings.length > 1 && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {bookings.map(item => <TouchableOpacity key={item.id} disabled={acting} accessibilityRole="button" accessibilityState={{ selected: item.id === bookingId }} onPress={() => { setBookingId(item.id); setContainerId(''); }} style={[styles.chip, item.id === bookingId && styles.selectedChip]}><Text style={{ color: item.id === bookingId ? '#145540' : '#64748b', fontWeight: '700', fontSize: 12 }}>{item.bookingCode}</Text></TouchableOpacity>)}
      </ScrollView>}
      {booking && <>
        <View style={styles.summary}>
          <View style={ui.row}><Text style={styles.eyebrow}>{bookingTypeLabel(booking.bookingType).toUpperCase()}</Text><TouchableOpacity onPress={() => router.push({ pathname: '/(driver)/booking-detail', params: { id: booking.id } })}><Text style={styles.link}>Xem booking ↗</Text></TouchableOpacity></View>
          <Text style={styles.bookingCode}>{booking.bookingCode}</Text>
          <Text style={ui.text}>{booking.truckPlate || 'Chưa gán xe'} · {container?.containerNo || 'Chưa có container'}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: journey.error || feedError ? '#b45309' : '#1d6c56' }} /><Text style={ui.muted}>{journey.error || feedError ? 'Chưa xác nhận lại kết nối' : journey.connected ? 'Đang đồng bộ sự kiện' : 'Tự kiểm tra mỗi 15 giây'}{journey.updatedAt ? ` · ${new Date(journey.updatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : ''}</Text></View>
        </View>
        {notice && <View style={styles.note}><Text style={ui.text}>{notice}</Text></View>}
        {booking.containers.length > 1 && <View style={{ gap: 8 }}><Text style={ui.muted}>Container đang theo dõi · {!journey.loading && !journey.error ? `${containers?.confirmed} / ${containers?.total} đã xác nhận` : `${booking.containers.length} container trong booking`}</Text><ScrollView horizontal contentContainerStyle={{ gap: 8 }}>{booking.containers.map(item => {
          const confirmed = journey.routes.some(route => route.bookingId === booking.id && route.containerId === item.id && route.journey?.containerConfirmedAt);
          return <TouchableOpacity key={item.id} accessibilityRole="button" accessibilityState={{ selected: item.id === container?.id }} disabled={acting} onPress={() => setContainerId(item.id)} style={[styles.chip, item.id === container?.id && styles.selectedChip]}><Text style={ui.text}>{confirmed ? '✓ ' : ''}{item.containerNo}</Text></TouchableOpacity>;
        })}</ScrollView></View>}
        <View style={ui.row}><Text style={ui.title}>Các chặng hành trình</Text><Text style={ui.muted}>{notice ? 'Chưa bắt đầu' : current === 'completed' ? 'Đã hoàn tất' : `${currentIndex + 1} / ${JOURNEY_STAGES.length}`}</Text></View>
        <ScrollView ref={timeline} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 4 }}>
          {JOURNEY_STAGES.map((item, index) => {
            const status = notice ? 'pending' : journeyStageState(item.id, current);
            const color = status === 'done' ? '#1d6c56' : status === 'active' ? '#a16207' : '#94a3b8';
            return <TouchableOpacity key={item.id} accessibilityRole="button" accessibilityLabel={`${item.title}, ${status === 'done' ? 'hoàn tất' : status === 'active' ? 'đang thực hiện' : 'chưa đến'}`} accessibilityState={{ selected: selected === item.id }} onPress={() => setViewStage(item.id)} style={{ width: 96, alignItems: 'center', gap: 7 }}>
              <View style={{ width: '100%', alignItems: 'center' }}>{index < JOURNEY_STAGES.length - 1 && <View style={{ position: 'absolute', height: 2, left: 48, right: -48, top: 21, backgroundColor: status === 'done' ? '#82b4a2' : '#dce3e9' }} />}<View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: status === 'done' ? '#e7f3ed' : status === 'active' ? '#fef3c7' : '#edf1f5', borderWidth: selected === item.id ? 2 : 1, borderColor: selected === item.id ? color : 'transparent', alignItems: 'center', justifyContent: 'center' }}><Ionicons name={status === 'done' ? 'checkmark' : item.icon as any} size={20} color={color} /></View></View>
              <Text numberOfLines={2} style={{ color: status === 'pending' ? '#64748b' : '#172b3a', fontSize: 11, fontWeight: selected === item.id ? '800' : '600', textAlign: 'center', minHeight: 32 }}>{item.title}</Text>
              <Text style={{ color, fontSize: 9 }}>{status === 'done' ? 'Hoàn tất' : status === 'active' ? 'Đang thực hiện' : 'Sắp tới'}</Text>
            </TouchableOpacity>;
          })}
        </ScrollView>
        <View style={[ui.card, { borderColor: isCurrent && current !== 'completed' ? '#e7cf83' : '#dce5e5' }]}>
          <View style={ui.row}><Text style={[styles.eyebrow, { color: stepState === 'active' ? '#a16207' : '#1d6c56' }]}>{stepState === 'done' ? 'ĐÃ HOÀN TẤT' : stepState === 'active' ? 'ĐANG THỰC HIỆN' : 'CHẶNG SẮP TỚI'}</Text><TouchableOpacity accessibilityLabel={`Chi tiết ${step.title}`} onPress={() => setModal('details')}><Ionicons name="information-circle-outline" size={22} color="#64748b" /></TouchableOpacity></View>
          <Text style={styles.stepTitle}>{step.title}</Text><Text style={ui.text}>{step.description}</Text>
          {selectedTime && <Text style={ui.muted}>Ghi nhận: {bookingTime(selectedTime)}</Text>}
          {!isCurrent && <TouchableOpacity onPress={() => setViewStage(current)} style={styles.note}><Text style={styles.link}>{stepState === 'done' ? 'Đang xem lại chặng đã hoàn tất.' : 'Xem trước hướng dẫn chặng này.'} Trở về chặng hiện tại →</Text></TouchableOpacity>}
          {isCurrent && selected === 'ready' && <DriverArrivalCard booking={booking} disabled={!canCoordinate} />}
          {isCurrent && selected === 'gate_in' && <View style={styles.note}><Text style={ui.text}>Đến GATE-01 với xe {booking.truckPlate}. Camera sẽ kiểm tra biển số và lệnh vào cổng.</Text><Text style={ui.muted}>Hệ thống hiện mô phỏng xe qua barie trong 10 giây sau khi xác minh thành công. Bước tiếp theo mở khi API ghi nhận Gate In.</Text><Text style={ui.muted}>Lệnh có hiệu lực đến {bookingTime(booking.gateEntryOrder?.validUntil)}.</Text></View>}
          {isCurrent && selected === 'to_yard' && <>
            <Text style={ui.text}>{target ? `Đang trên đường tới ${target}. Trạng thái này được giữ đến khi bạn xác nhận đã đến.` : route ? 'Đã vào bãi. Đang chờ điểm giao nhận được phân công.' : 'Đã ghi nhận vào cổng. Đang đồng bộ điểm giao nhận và lộ trình.'}</Text>
            {route?.navigation?.status === 'available' && <Text style={ui.muted}>{Math.round(route.navigation.distanceMeters || 0)} m · khoảng {Math.max(1, Math.ceil((route.navigation.estimatedSeconds || 0) / 60))} phút</Text>}
            {progress?.canArrive ? button('Tôi đã đến đúng điểm giao nhận', () => setModal('arrive'), !fresh) : <Text style={ui.muted}>Chờ tuyến và điểm giao nhận hợp lệ. Bạn chưa cần thực hiện thao tác khác.</Text>}
          </>}
          {isCurrent && selected === 'handover' && <>
            <Text style={ui.text}>Vị trí: {target || route?.navigation?.origin?.label || 'Điểm giao nhận được phân công'}</Text>
            <Text style={ui.text}>{progress?.containerConfirmedAt ? 'Đã xác nhận container này. Chọn container còn lại của booking để tiếp tục; chỉ ra cổng khi tất cả đã hoàn tất.' : progress?.canConfirmContainer ? 'Nhân viên bãi đã xử lý xong. Kiểm tra container và xác nhận kết quả giao nhận.' : 'Chờ nhân viên bãi hoàn tất lệnh xử lý. Nút xác nhận sẽ tự mở khi có kết quả.'}</Text>
            {progress?.containerConfirmedAt && containers?.next && containers.next.id !== container?.id && button(`Tiếp tục ${containers.next.containerNo}`, () => setContainerId(containers.next!.id), !fresh)}
            {progress?.canConfirmContainer && button(`Kiểm tra & xác nhận ${bookingTypeLabel(booking.bookingType).toLowerCase()}`, () => { setCondition('OK'); setModal('confirm'); }, !fresh)}
          </>}
          {isCurrent && selected === 'to_exit' && <View style={styles.note}><Text style={ui.text}>Đã hoàn tất giao nhận các container của booking. Theo tuyến trên bản đồ đến {progress?.exitGateCode || 'GATE-03'}.</Text><Text style={ui.text}>Dùng cùng booking {booking.bookingCode} tại cổng ra; không tạo booking mới. Chuyến chỉ hoàn thành khi hệ thống ghi nhận Gate Out.</Text></View>}
          {isCurrent && selected === 'gate_out' && <Text style={ui.text}>Đang ở mốc cổng ra. Chờ hệ thống kiểm tra và ghi nhận xe qua cổng. Hoàn thành sẽ tự cập nhật.</Text>}
          {selected === 'completed' && isCurrent && <Text style={{ color: '#1d6c56', lineHeight: 22 }}>Đã hoàn tất giao / nhận hàng và rời cảng. Chạm các chặng phía trên để xem lại.</Text>}
          {actionError && <Text accessibilityRole="alert" style={styles.error}>{actionError}</Text>}
        </View>
        {(journey.error || feedError) && <View accessibilityRole="alert" style={[ui.card, { backgroundColor: '#fff7ed' }]}><Text style={styles.error}>{journey.error || feedError}</Text><Text style={ui.text}>Thông tin hành trình có thể chưa mới. Xác nhận đến điểm và giao nhận được tạm khóa cho đến khi cập nhật thành công.</Text><TouchableOpacity onPress={() => void refresh()}><Text style={styles.link}>Cập nhật lại</Text></TouchableOpacity></View>}
        {journey.loading && !journey.error && <ActivityIndicator color="#1d6c56" />}
        <View style={ui.row}><View><Text style={ui.title}>Sơ đồ cảng 2D</Text><Text style={ui.muted}>Vị trí theo mốc được hệ thống xác nhận</Text></View><TouchableOpacity accessibilityLabel="Mở rộng bản đồ" onPress={() => setModal('map')} style={styles.iconButton}><Ionicons name="expand-outline" size={20} color="#172b3a" /></TouchableOpacity></View>
        {map}
        {journey.mapWarning && <View style={styles.note}><Text style={styles.error}>{journey.mapWarning}</Text><TouchableOpacity accessibilityRole="button" onPress={() => void journey.reload()}><Text style={styles.link}>Thử tải lại bản đồ</Text></TouchableOpacity></View>}
        {route?.navigation?.message && <Text style={ui.muted}>{route.navigation.message}</Text>}
        {isCurrent && ['to_yard', 'to_exit'].includes(current) && route?.navigation?.status === 'available' && !journey.error && <View style={ui.card}><Text style={ui.title}>Hướng dẫn đến {route.navigation.destinationNode?.label}</Text>{route.navigation.directions.map((line, index) => <Text key={`${index}:${line}`} style={ui.text}>{index + 1}. {line}</Text>)}</View>}
      </>}
    </ScrollView>
    <Modal visible={!!modal} transparent animationType="slide" onRequestClose={() => { if (!acting) setModal(null); }}>
      <View style={styles.backdrop}><View accessibilityViewIsModal style={styles.sheet}>
        <View style={ui.row}><Text style={ui.title}>{modal === 'confirm' ? 'Kiểm tra giao nhận container' : modal === 'arrive' ? 'Xác nhận đã đến' : modal === 'map' ? 'Sơ đồ cảng hiện tại' : step.title}</Text><TouchableOpacity accessibilityLabel="Đóng chi tiết" disabled={acting} onPress={() => setModal(null)} style={styles.iconButton}><Ionicons name="close" size={24} color="#172b3a" /></TouchableOpacity></View>
        <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 16 }} keyboardShouldPersistTaps="handled">
          {modal === 'map' ? map : modal === 'details' ? <><Text style={ui.text}>{step.description}</Text><Text style={ui.text}>Booking: {booking?.bookingCode}</Text><Text style={ui.text}>Xe: {booking?.truckPlate || 'Chưa gán'}</Text><Text style={ui.text}>Container: {container?.containerNo || 'Chưa gán'}</Text><Text style={ui.text}>Điểm đến hiện tại: {target || 'Chưa có'}</Text><Text style={ui.muted}>Thời điểm hoàn tất chặng: {bookingTime(selectedTime)}</Text></> : modal === 'arrive' ? <><Text style={ui.text}>Xe đã dừng đúng tại {target || route?.navigation?.destinationNode?.label}? Chỉ xác nhận khi bạn đã tới điểm giao nhận.</Text>{button('Đúng vị trí · xác nhận đã đến', () => void execute('arrive'), !fresh)}</> : <>
            <Text style={styles.bookingCode}>{container?.containerNo}</Text><Text style={ui.text}>Số chì: {container?.sealNumber || 'Chưa khai báo'} · {container?.containerType || 'Container'}</Text>
            {([['OK', 'Đúng container · nguyên vẹn'], ['DAMAGED', 'Có hư hỏng'], ['ISSUE', 'Có vấn đề khác']] as const).map(([value, label]) => <TouchableOpacity key={value} disabled={acting} onPress={() => setCondition(value)} style={[styles.chip, value === condition && styles.selectedChip]}><Text style={ui.text}>{value === condition ? '●' : '○'} {label}</Text></TouchableOpacity>)}
            <TextInput accessibilityLabel="Ghi chú tình trạng container" editable={!acting} multiline maxLength={1000} placeholder="Ghi chú tình trạng (bắt buộc nếu có vấn đề)" placeholderTextColor="#64748b" value={notes} onChangeText={setNotes} style={styles.input} />
            {button('Xác nhận giao / nhận container', () => void execute('confirm'), !fresh || condition !== 'OK' && !notes.trim())}
          </>}
          {actionError && <Text accessibilityRole="alert" style={styles.error}>{actionError}</Text>}
        </ScrollView>
      </View></View>
    </Modal>
  </View>;
}

const styles = StyleSheet.create({
  header: { paddingTop: 54, paddingBottom: 18, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, color: '#64748b' },
  heading: { color: '#172b3a', fontSize: 27, fontWeight: '800', marginVertical: 5 },
  summary: { borderRadius: 20, padding: 20, gap: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#dce5e5' },
  bookingCode: { fontSize: 23, fontWeight: '800', color: '#172b3a' },
  chip: { padding: 12, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' },
  selectedChip: { backgroundColor: '#edf6f1', borderColor: '#8fbaa8' },
  link: { color: '#1d6c56', fontSize: 12, fontWeight: '700', lineHeight: 20 },
  iconButton: { padding: 10, borderRadius: 12, backgroundColor: '#edf1f5' },
  stepTitle: { fontSize: 22, fontWeight: '800', color: '#172b3a' },
  note: { borderRadius: 12, backgroundColor: '#f8fafb', padding: 12, gap: 8 },
  primary: { backgroundColor: '#1d6c56', borderRadius: 13, padding: 16, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 14, textAlign: 'center' },
  error: { color: '#b45309', fontSize: 13, lineHeight: 21 },
  backdrop: { flex: 1, justifyContent: 'flex-end', padding: 12, backgroundColor: '#0f172a88' },
  sheet: { maxHeight: '88%', width: '100%', maxWidth: 760, alignSelf: 'center', backgroundColor: '#fff', padding: 20, borderRadius: 24, gap: 18 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, padding: 14, color: '#172b3a', minHeight: 92, textAlignVertical: 'top', backgroundColor: '#f8fafb' },
});
