import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useBookings } from "../../src/features/bookings/BookingProvider";
import { getBooking } from "../../src/features/bookings/bookingService";
import { bookingTime, bookingTypeLabel, canViewAppointment } from "../../src/features/bookings/bookingPresentation";
import { BookingHeader, BookingStatus, ui } from "../../src/features/bookings/components/BookingUI";
import type { DriverBooking } from "../../src/features/bookings/types";

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { feed } = useBookings();
  const [booking, setBooking] = useState<DriverBooking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    if (!id) { setError("Thiếu mã booking."); return; }
    getBooking(id).then((data) => {
      if (active) { setBooking(data); setError(null); }
    }).catch((err) => {
      if (active) { setBooking(null); setError(err.message); }
    });
    return () => { active = false; };
  }, [id, feed, revision]);

  return <View style={ui.page}>
    <BookingHeader title="Chi tiết booking" />
    <ScrollView contentContainerStyle={ui.content}>
      {error ? <View style={ui.card}>
        <Text style={{ color: "#b91c1c" }}>{error}</Text>
        <TouchableOpacity onPress={() => setRevision((value) => value + 1)}><Text style={{ color: "#ff682c" }}>Thử lại</Text></TouchableOpacity>
      </View> : !booking ? <ActivityIndicator color="#ff682c" /> : <>
        <View style={ui.card}>
          <Text style={{ color: "#172b3a", fontSize: 24, fontWeight: "700" }}>{booking.bookingCode}</Text>
          <BookingStatus status={booking.status} />
          <Text style={ui.text}>{bookingTypeLabel(booking.bookingType)}</Text>
          <Text style={ui.muted}>{booking.carrierName}</Text>
          {booking.status === 'completed' && <Text style={ui.muted}>Đã xong giao nhận tại bãi. Hành trình chỉ hoàn tất khi hệ thống ghi nhận Gate Out.</Text>}
        </View>
        <View style={[ui.card, { borderColor: canViewAppointment(booking.status) ? "#48bb7860" : "#e8d6a1", backgroundColor: canViewAppointment(booking.status) ? '#fff' : '#fff9eb' }]}>
          <Text style={ui.title}>{canViewAppointment(booking.status) ? "Lịch hẹn đã được duyệt" : booking.status === "pending" ? "Chờ duyệt booking" : "Lịch hẹn không còn hiệu lực"}</Text>
          {canViewAppointment(booking.status) && <><Text style={ui.text}>Từ: {bookingTime(booking.appointmentStart)}</Text><Text style={ui.text}>Đến: {bookingTime(booking.appointmentEnd)}</Text>
          {booking.approvedAt && <Text style={ui.muted}>Duyệt lúc: {bookingTime(booking.approvedAt)}</Text>}</>}
          {booking.status === "pending" && <Text style={{ color: "#80550b", lineHeight: 21 }}>Booking này đang chờ điều độ duyệt nên chưa có lịch hẹn để thực hiện. Lịch và các bước xác nhận sẽ mở sau khi được duyệt; ứng dụng sẽ tự cập nhật khi có kết quả.</Text>}
          {canViewAppointment(booking.status) && <TouchableOpacity onPress={() => router.push("/(driver)/appointments")}>
            <Text style={{ color: "#0369a1", fontWeight: "700" }}>Xem trong lịch hẹn →</Text>
          </TouchableOpacity>}
          {booking.rejectedReason && <Text style={{ color: "#b91c1c" }}>Lý do: {booking.rejectedReason}</Text>}
        </View>
        {canViewAppointment(booking.status) && <TouchableOpacity style={[ui.card, { backgroundColor: '#edf6f1', borderColor: '#8fbaa8' }]} onPress={() => router.push({ pathname: '/(driver)/yard-navigation', params: { bookingId: booking.id } })}><Text style={{ color: '#1d6c56', fontWeight: '700' }}>Theo dõi hành trình & các việc cần làm →</Text><Text style={ui.muted}>Sẵn sàng · cổng vào · giao nhận tại bãi · cổng ra</Text></TouchableOpacity>}
        <View style={ui.card}>
          <Text style={ui.title}>Xe & tài xế</Text>
          <Text style={ui.text}>Biển số: {booking.truckPlate || "Chưa được gán xe"}</Text>
          <Text style={ui.text}>Tài xế: {booking.driverName}</Text>
          <Text style={ui.muted}>Công ty: {booking.carrierName}</Text>
        </View>
        <Text style={ui.title}>Hàng hóa · {booking.containers.length} container</Text>
        {booking.containers.map((container) => <View key={container.id} style={ui.card}>
          <Text style={ui.title}>{container.containerNo} · {container.containerType || "—"}</Text>
          <Text style={ui.text}>Loại hàng: {container.cargoType || "Chưa khai báo"}</Text>
          <Text style={ui.text}>Tải trọng: {container.grossWeightKg == null ? "Chưa khai báo" : `${Number(container.grossWeightKg).toLocaleString("vi-VN")} kg`}</Text>
          <Text style={ui.text}>Tình trạng: {container.loadStatus === "empty" ? "Rỗng" : container.loadStatus === "laden" || container.loadStatus === "full" ? "Có hàng" : container.loadStatus || "Chưa khai báo"}</Text>
          <Text style={ui.muted}>Số chì: {container.sealNumber || "Chưa có"}</Text>
          {container.customerName && <Text style={ui.muted}>Khách hàng: {container.customerName}</Text>}
          {canViewAppointment(booking.status) && <TouchableOpacity accessibilityRole="button" onPress={() => router.push({ pathname: "/(driver)/yard-navigation", params: { bookingId: booking.id, containerId: container.id } } as any)} style={{ marginTop: 4, padding: 13, borderRadius: 12, borderWidth: 1, borderColor: "#ff922e70", backgroundColor: "#ff922e15" }}>
            <Text style={{ color: "#9a431b", fontWeight: "700" }}>Smart Route · Điểm giao nhận & cổng ra →</Text>
            <Text style={[ui.muted, { marginTop: 4 }]}>Tự cập nhật khi cổng xác nhận Gate In và Yard hoàn tất xử lý.</Text>
          </TouchableOpacity>}
        </View>)}
        {booking.description && <View style={ui.card}><Text style={ui.title}>Ghi chú</Text><Text style={ui.text}>{booking.description}</Text></View>}
      </>}
    </ScrollView>
  </View>;
}
