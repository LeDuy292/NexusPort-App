import { useState } from "react";
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useBookings } from "../../src/features/bookings/BookingProvider";
import { BookingCard, BookingFeedState, BookingHeader, ui } from "../../src/features/bookings/components/BookingUI";
import { isApproved } from "../../src/features/bookings/bookingPresentation";

const FILTERS = [
  { key: "all", label: "Tất cả" },
  { key: "pending", label: "Chờ duyệt" },
  { key: "approved", label: "Đã duyệt" },
];

export default function DriverBookings() {
  const { feed, loading, error, reload } = useBookings();
  const [filter, setFilter] = useState("all");
  const bookings = (feed?.bookings || []).filter((booking) =>
    filter === "all" ? true : filter === "approved" ? isApproved(booking.status) : booking.status === filter
  );

  return (
    <View style={ui.page}>
      <BookingHeader title="Booking được giao" />
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 20,
          paddingVertical: 12,
          gap: 10,
          backgroundColor: "#ffffff",
          borderBottomWidth: 1,
          borderBottomColor: "#f1f5f9",
        }}
      >
        {FILTERS.map((item) => {
          const active = filter === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              onPress={() => setFilter(item.key)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: active ? "#ff682c" : "#ffffff",
                borderWidth: 1,
                borderColor: active ? "#ff682c" : "#e2e8f0",
                shadowColor: active ? "#ff682c" : "#0f172a",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: active ? 0.25 : 0.03,
                shadowRadius: 4,
                elevation: active ? 3 : 1,
              }}
            >
              <Text
                style={{
                  color: active ? "#ffffff" : "#475569",
                  fontSize: 13,
                  fontWeight: active ? "700" : "600",
                }}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <ScrollView
        contentContainerStyle={ui.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void reload()} tintColor="#ff682c" />}
      >
        <BookingFeedState />
        {bookings.map((booking) => (
          <BookingCard key={booking.id} booking={booking} />
        ))}
        {!loading && !error && feed?.profile && !bookings.length && (
          <View style={[ui.card, { alignItems: "center", paddingVertical: 40 }]}>
            <Text style={ui.muted}>
              Chưa có booking trong nhóm này. Khi công ty phân công, booking sẽ xuất hiện tại đây.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
