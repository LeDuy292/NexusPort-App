import { useState } from "react";
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useBookings } from "../../src/features/bookings/BookingProvider";
import { bookingTime } from "../../src/features/bookings/bookingPresentation";
import { BookingFeedState, BookingHeader, ui } from "../../src/features/bookings/components/BookingUI";
import type { BookingNotification } from "../../src/features/bookings/types";

export default function DriverNotifications() {
  const { feed, loading, error, reload, markRead } = useBookings();
  const [readError, setReadError] = useState<string | null>(null);

  const open = async (item: BookingNotification) => {
    setReadError(null);
    try {
      if (!item.isRead) await markRead(item.id);
    } catch {
      setReadError("Chưa đánh dấu đã đọc được. Bạn vẫn có thể xem chi tiết booking.");
    }
    router.push({ pathname: "/(driver)/booking-detail" as any, params: { id: item.bookingId } });
  };

  return (
    <View style={ui.page}>
      <BookingHeader title={`Thông báo${feed?.unreadCount ? ` (${feed.unreadCount} mới)` : ""}`} />
      <ScrollView
        contentContainerStyle={ui.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void reload()} tintColor="#ff682c" />}
      >
        <BookingFeedState />
        {readError && (
          <View style={[ui.card, { backgroundColor: "#fffbeb", borderColor: "#fde68a" }]}>
            <Text style={{ color: "#92400e", fontSize: 13 }}>{readError}</Text>
          </View>
        )}

        {feed?.notifications.map((item) => {
          const isApproved = item.kind === "approved";
          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.8}
              style={[
                ui.card,
                {
                  borderColor: item.isRead ? "#e2e8f0" : "#ff682c",
                  borderLeftWidth: item.isRead ? 1 : 4,
                  borderLeftColor: item.isRead ? "#e2e8f0" : "#ff682c",
                },
              ]}
              onPress={() => void open(item)}
            >
              <View style={ui.row}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      backgroundColor: isApproved ? "rgba(22,163,74,0.12)" : "rgba(255,104,44,0.12)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name={isApproved ? "checkmark-circle" : "notifications"}
                      size={20}
                      color={isApproved ? "#16a34a" : "#ff682c"}
                    />
                  </View>
                  <Text style={[ui.title, { flex: 1 }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                </View>
                {!item.isRead && (
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 12,
                      backgroundColor: "#ff682c",
                    }}
                  >
                    <Text style={{ color: "#ffffff", fontSize: 10, fontWeight: "800" }}>MỚI</Text>
                  </View>
                )}
              </View>

              <Text style={[ui.text, { marginTop: 2 }]}>{item.message}</Text>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: 8,
                  borderTopWidth: 1,
                  borderTopColor: "#f1f5f9",
                  marginTop: 4,
                }}
              >
                <Text style={{ color: "#0284c7", fontSize: 12, fontWeight: "700" }}>{item.bookingCode}</Text>
                <Text style={ui.muted}>{bookingTime(item.createdAt)}</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {!loading && !error && feed?.profile && !feed.notifications.length && (
          <View style={[ui.card, { alignItems: "center", paddingVertical: 40, gap: 12 }]}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                backgroundColor: "#f1f5f9",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="notifications-off-outline" size={32} color="#94a3b8" />
            </View>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#0f172a" }}>Không có thông báo nào</Text>
            <Text style={{ color: "#64748b", textAlign: "center", fontSize: 13, lineHeight: 20, paddingHorizontal: 20 }}>
              Khi công ty vận tải phân công booking mới hoặc điều độ cảng phê duyệt lịch hẹn, thông báo sẽ tự động xuất hiện tại đây.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
