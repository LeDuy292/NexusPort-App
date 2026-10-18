import { RefreshControl, ScrollView, Text, View } from "react-native";
import { useBookings } from "../../src/features/bookings/BookingProvider";
import { canViewAppointment } from "../../src/features/bookings/bookingPresentation";
import { BookingApprovalNotice, BookingCard, BookingFeedState, BookingHeader, ui } from "../../src/features/bookings/components/BookingUI";

export default function DriverAppointments() {
  const { feed, loading, error, reload } = useBookings();
  const pendingCount = (feed?.bookings || []).filter(booking => booking.status.toLowerCase() === 'pending').length;
  const appointments = (feed?.bookings || []).filter((booking) => canViewAppointment(booking.status))
    .sort((left, right) => Date.parse(left.appointmentStart) - Date.parse(right.appointmentStart));
  const upcoming = appointments.filter((booking) => Date.parse(booking.appointmentEnd) >= Date.now());
  const past = appointments.filter((booking) => Date.parse(booking.appointmentEnd) < Date.now());
  return <View style={ui.page}>
    <BookingHeader title="Lịch hẹn đã duyệt" />
    <ScrollView contentContainerStyle={ui.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void reload()} tintColor="#ff682c" />}>
      <BookingFeedState />
      <Text style={ui.muted}>Chỉ hiển thị booking đã được duyệt. Chạm vào lịch để xem xe, hàng hóa và khung giờ.</Text>
      {appointments.length > 0 && pendingCount > 0 && <Text style={{ color: '#80550b', lineHeight: 21 }}>{pendingCount} booking đang chờ duyệt chưa có trong lịch hẹn.</Text>}
      {upcoming.length > 0 && <Text style={ui.title}>Sắp tới · {upcoming.length}</Text>}
      {upcoming.map((booking) => <BookingCard key={booking.id} booking={booking} style={{ borderColor: "#48bb7850" }} />)}
      {past.length > 0 && <Text style={ui.title}>Đã qua khung giờ</Text>}
      {past.map((booking) => <BookingCard key={booking.id} booking={booking} />)}
      {!loading && !error && feed?.profile && !appointments.length && <BookingApprovalNotice pendingCount={pendingCount} />}
    </ScrollView>
  </View>;
}
