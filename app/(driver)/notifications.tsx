import { useState } from "react";
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useBookings } from "../../src/features/bookings/BookingProvider";
import { bookingTime } from "../../src/features/bookings/bookingPresentation";
import { BookingFeedState, BookingHeader, ui } from "../../src/features/bookings/components/BookingUI";
import type { BookingNotification } from "../../src/features/bookings/types";

export default function DriverNotifications() {
  const { feed, loading, error, reload, markRead } = useBookings();
  const [readError, setReadError] = useState<string | null>(null);
  const open = async (item: BookingNotification) => {
    setReadError(null);
    try { if (!item.isRead) await markRead(item.id); }
    catch { setReadError("Chưa đánh dấu đã đọc được. Bạn vẫn có thể xem booking."); }
    router.push({ pathname: "/(driver)/booking-detail" as any, params: { id: item.bookingId } });
  };
  return <View style={ui.page}>
    <BookingHeader title={`Thông báo${feed?.unreadCount ? ` · ${feed.unreadCount} mới` : ""}`} />
    <ScrollView contentContainerStyle={ui.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void reload()} tintColor="#ff682c" />}>
      <BookingFeedState />
      {readError && <Text style={{ color: "#f6ad55" }}>{readError}</Text>}
      {feed?.notifications.map((item) => <TouchableOpacity key={item.id} style={[ui.card, { borderColor: item.isRead ? "#282828" : "#ff682c70" }]} onPress={() => void open(item)}>
        <View style={ui.row}>
          <Ionicons name={item.kind === "approved" ? "checkmark-circle" : "notifications"} size={24} color={item.kind === "approved" ? "#48bb78" : "#ff682c"} />
          <Text style={[ui.title, { flex: 1 }]}>{item.title}</Text>
          {!item.isRead && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#ff682c" }} />}
        </View>
        <Text style={ui.text}>{item.message}</Text>
        <Text style={ui.muted}>{bookingTime(item.createdAt)} · {item.bookingCode}</Text>
      </TouchableOpacity>)}
      {!loading && !error && feed?.profile && !feed.notifications.length && <Text style={ui.muted}>Chưa có thông báo. Khi công ty giao booking hoặc điều độ duyệt, bạn sẽ nhận thông báo tại đây.</Text>}
    </ScrollView>
  </View>;
}
