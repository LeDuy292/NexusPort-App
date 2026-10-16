import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const BOOKINGS = [
  { id: "BK-2024-001", plate: "51G-123.45", driver: "Nguyễn Văn A", container: "MSKU1234567", time: "14:00", gate: "Cổng A", status: "confirmed", statusLabel: "Đã xác nhận" },
  { id: "BK-2024-002", plate: "30F-456.78", driver: "Trần Văn B", container: "CMAU9876543", time: "16:30", gate: "Cổng B", status: "pending", statusLabel: "Chờ xử lý" },
  { id: "BK-2024-003", plate: "43C-789.01", driver: "Lê Thị C", container: "TGHU5554321", time: "08:00", gate: "Cổng A", status: "confirmed", statusLabel: "Đã xác nhận" },
  { id: "BK-2024-004", plate: "72A-112.34", driver: "Phạm Văn D", container: "MSCU7788990", time: "09:30", gate: "Cổng B", status: "cancelled", statusLabel: "Đã hủy" },
];

const STATUS_COLORS: Record<string, string> = {
  confirmed: "#48bb78", pending: "#f6ad55", cancelled: "#fc5b5b",
};

export default function GateBookings() {
  const pending = BOOKINGS.filter(b => b.status === "pending").length;

  return (
    <View style={{ flex: 1, backgroundColor: "#080808" }}>
      <LinearGradient
        colors={["rgba(255,104,44,0.12)", "transparent"]}
        style={{ paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.07)" }}
            >
              <Ionicons name="arrow-back" size={18} color="white" />
            </TouchableOpacity>
            <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>Danh sách Booking</Text>
          </View>
          {pending > 0 && (
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "#fc5b5b", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: "white", fontSize: 11, fontWeight: "700" }}>{pending}</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 12 }} showsVerticalScrollIndicator={false}>
        {BOOKINGS.map(b => (
          <TouchableOpacity
            key={b.id}
            style={{ borderRadius: 16, padding: 16, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: b.status === "pending" ? "rgba(255,104,44,0.25)" : "rgba(255,255,255,0.07)" }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              <View style={{ width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,104,44,0.12)", marginRight: 12 }}>
                <MaterialCommunityIcons name="clipboard-check-outline" size={22} color="#ff682c" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "white", fontWeight: "700", fontSize: 14 }}>{b.id} · {b.container}</Text>
                <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 2 }}>{b.plate} · {b.driver}</Text>
              </View>
              <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: STATUS_COLORS[b.status] + "20" }}>
                <Text style={{ fontSize: 11, fontWeight: "600", color: STATUS_COLORS[b.status] }}>{b.statusLabel}</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.3)" />
                <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>Hôm nay, {b.time}</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.3)" />
                <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>{b.gate}</Text>
              </View>
            </View>
            {b.status === "pending" && (
              <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                <TouchableOpacity style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: "#48bb78", alignItems: "center" }}>
                  <Text style={{ color: "white", fontWeight: "600", fontSize: 13 }}>Xác nhận</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: "rgba(252,91,91,0.12)", borderWidth: 1, borderColor: "rgba(252,91,91,0.3)", alignItems: "center" }}>
                  <Text style={{ color: "#fc5b5b", fontWeight: "600", fontSize: 13 }}>Từ chối</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
