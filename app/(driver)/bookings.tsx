import { useState } from "react";
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useBookings } from "../../src/features/bookings/BookingProvider";
import { BookingCard, BookingFeedState, BookingHeader, ui } from "../../src/features/bookings/components/BookingUI";
import { isApproved } from "../../src/features/bookings/bookingPresentation";

const FILTERS = [{ key: "all", label: "Tất cả" }, { key: "pending", label: "Chờ duyệt" }, { key: "approved", label: "Đã duyệt" }];

export default function DriverBookings() {
  const { feed, loading, error, reload } = useBookings();
  const [filter, setFilter] = useState("all");
  const bookings = (feed?.bookings || []).filter((booking) => filter === "all" || (filter === "approved" ? isApproved(booking.status) : booking.status === filter));
  return <View style={ui.page}>
    <BookingHeader title="Booking được giao" />
    <View style={{ flexDirection: "row", paddingHorizontal: 20, gap: 10, paddingBottom: 16 }}>
      {FILTERS.map((item) => <TouchableOpacity key={item.key} onPress={() => setFilter(item.key)} style={{ padding: 10, borderRadius: 20, backgroundColor: filter === item.key ? "#ff682c" : "#222" }}>
        <Text style={{ color: "white", fontSize: 12, fontWeight: "600" }}>{item.label}</Text>
      </TouchableOpacity>)}
    </View>
    <ScrollView contentContainerStyle={ui.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void reload()} tintColor="#ff682c" />}>
      <BookingFeedState />
      {bookings.map((booking) => <BookingCard key={booking.id} booking={booking} />)}
      {!loading && !error && feed?.profile && !bookings.length && <Text style={ui.muted}>Chưa có booking trong nhóm này. Khi công ty phân công, booking sẽ xuất hiện tại đây.</Text>}
    </ScrollView>
  </View>;
}
