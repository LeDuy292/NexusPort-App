import { RefreshControl, ScrollView, Text, View } from "react-native";
import { useBookings } from "../../src/features/bookings/BookingProvider";
import { isApproved } from "../../src/features/bookings/bookingPresentation";
import { BookingCard, BookingFeedState, BookingHeader, ui } from "../../src/features/bookings/components/BookingUI";

export default function DriverAppointments() {
  const { feed, loading, error, reload } = useBookings();
  const appointments = (feed?.bookings || []).filter((booking) => isApproved(booking.status))
    .sort((left, right) => Date.parse(left.appointmentStart) - Date.parse(right.appointmentStart));
  const upcoming = appointments.filter((booking) => Date.parse(booking.appointmentEnd) >= Date.now());
  const past = appointments.filter((booking) => Date.parse(booking.appointmentEnd) < Date.now());
  return <View style={ui.page}>
    <BookingHeader title="Lịch hẹn đã duyệt" />
    <ScrollView contentContainerStyle={ui.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void reload()} tintColor="#ff682c" />}>
      <BookingFeedState />
      <Text style={ui.muted}>Chỉ hiển thị booking đã được duyệt. Chạm vào lịch để xem xe, hàng hóa và khung giờ.</Text>
      {upcoming.length > 0 && <Text style={ui.title}>Sắp tới · {upcoming.length}</Text>}
      {upcoming.map((booking) => <BookingCard key={booking.id} booking={booking} style={{ borderColor: "#48bb7850" }} />)}
      {past.length > 0 && <Text style={ui.title}>Đã qua khung giờ</Text>}
      {past.map((booking) => <BookingCard key={booking.id} booking={booking} />)}
      {!loading && !error && feed?.profile && !appointments.length && <Text style={ui.muted}>Chưa có lịch hẹn đã duyệt. Booking đang chờ duyệt nằm trong mục Booking được giao.</Text>}
    </ScrollView>
  </View>;
}
