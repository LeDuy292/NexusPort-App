import { useRef, useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/features/auth/AuthProvider';
import { useBookings } from '../../src/features/bookings/BookingProvider';
import { BookingHeader, ui } from '../../src/features/bookings/components/BookingUI';

export default function DriverAccount() {
  const { user, signOut } = useAuth();
  const { feed } = useBookings();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  const logout = async () => {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError('');
    try { await signOut(); }
    catch { setError('Không thể đăng xuất. Vui lòng thử lại.'); }
    finally { pending.current = false; setBusy(false); }
  };
  return <View style={ui.page}><BookingHeader title="Tài khoản tài xế" /><ScrollView contentContainerStyle={ui.content}>
    <View style={ui.card}><Ionicons name="person-circle-outline" size={52} color="#1d6c56" /><Text style={ui.title}>{feed?.profile?.fullName || user?.fullName || user?.username}</Text><Text style={ui.text}>{feed?.profile?.carrierName}</Text><Text style={ui.muted}>{user?.email}</Text><Text style={ui.text}>Giấy phép: {feed?.profile?.licenseNumber || 'Chưa liên kết hồ sơ'}</Text></View>
    {[['Lịch hẹn', '/(driver)/appointments'], ['Lệnh vận chuyển', '/(driver)/trips'], ['Booking được giao', '/(driver)/bookings']].map(([label, path]) => <TouchableOpacity key={label} style={[ui.card, ui.row]} onPress={() => router.push(path as any)}><Text style={ui.text}>{label}</Text><Ionicons name="chevron-forward" size={18} color="#64748b" /></TouchableOpacity>)}
    <TouchableOpacity onPress={() => setVisible(true)} style={[ui.card, { borderColor: '#fecaca' }]}><Text style={{ color: '#b91c1c', fontWeight: '700' }}>Đăng xuất</Text></TouchableOpacity>
  </ScrollView><Modal visible={visible} transparent animationType="fade" onRequestClose={() => { if (!busy) setVisible(false); }}><View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#0f172a88', padding: 24 }}><View accessibilityViewIsModal style={ui.card}><Text style={ui.title}>Đăng xuất tài khoản?</Text><Text style={ui.text}>Bạn sẽ cần đăng nhập lại để tiếp tục theo dõi hành trình.</Text>{!!error && <Text style={{ color: '#b91c1c' }}>{error}</Text>}<TouchableOpacity disabled={busy} onPress={() => void logout()} style={{ padding: 15, borderRadius: 12, backgroundColor: '#b91c1c' }}><Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700' }}>{busy ? 'Đang đăng xuất…' : 'Đăng xuất'}</Text></TouchableOpacity><TouchableOpacity disabled={busy} onPress={() => setVisible(false)} style={{ padding: 12 }}><Text style={{ color: '#334155', textAlign: 'center' }}>Ở lại</Text></TouchableOpacity></View></View></Modal></View>;
}
