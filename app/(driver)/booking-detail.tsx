import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useBookings } from "../../src/features/bookings/BookingProvider";
import { getBooking } from "../../src/features/bookings/bookingService";
import { bookingTime, bookingTypeLabel, isApproved } from "../../src/features/bookings/bookingPresentation";
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
        <Text style={{ color: "#fc5b5b" }}>{error}</Text>
        <TouchableOpacity onPress={() => setRevision((value) => value + 1)}><Text style={{ color: "#ff682c" }}>Thử lại</Text></TouchableOpacity>
      </View> : !booking ? <ActivityIndicator color="#ff682c" /> : <>
        <View style={ui.card}>
          <Text style={{ color: "white", fontSize: 24, fontWeight: "700" }}>{booking.bookingCode}</Text>
          <BookingStatus status={booking.status} />
          <Text style={ui.text}>{bookingTypeLabel(booking.bookingType)}</Text>
          <Text style={ui.muted}>{booking.carrierName}</Text>
        </View>
        <View style={[ui.card, { borderColor: isApproved(booking.status) ? "#48bb7860" : "#f6ad5560" }]}>
          <Text style={ui.title}>{isApproved(booking.status) ? "Lịch hẹn đã được duyệt" : booking.status === "pending" ? "Khung giờ đề xuất" : "Khung giờ booking"}</Text>
          <Text style={ui.text}>Từ: {bookingTime(booking.appointmentStart)}</Text>
          <Text style={ui.text}>Đến: {bookingTime(booking.appointmentEnd)}</Text>
          {booking.status === "pending" && <Text style={{ color: "#f6ad55", lineHeight: 21 }}>Đang chờ điều độ duyệt. Chưa khởi hành theo lịch này cho đến khi có xác nhận.</Text>}
          {booking.approvedAt && <Text style={ui.muted}>Duyệt lúc: {bookingTime(booking.approvedAt)}</Text>}
          {isApproved(booking.status) && <TouchableOpacity onPress={() => router.push("/(driver)/appointments")}>
            <Text style={{ color: "#63b3ed", fontWeight: "700" }}>Xem trong lịch hẹn →</Text>
          </TouchableOpacity>}
          {booking.rejectedReason && <Text style={{ color: "#fc5b5b" }}>Lý do: {booking.rejectedReason}</Text>}
        </View>
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
        </View>)}
        {booking.description && <View style={ui.card}><Text style={ui.title}>Ghi chú</Text><Text style={ui.text}>{booking.description}</Text></View>}
      </>}
    </ScrollView>
  </View>;
}
