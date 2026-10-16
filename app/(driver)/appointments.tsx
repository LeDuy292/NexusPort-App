import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const APPOINTMENTS = [
  {
    id: "BK-2024-001",
    container: "MSKU1234567",
    date: "Hôm nay, 14:00",
    gate: "Cổng A",
    type: "Nhập hàng",
    status: "confirmed",
    statusLabel: "Đã xác nhận",
  },
  {
    id: "BK-2024-002",
    container: "CMAU9876543",
    date: "Hôm nay, 16:30",
    gate: "Cổng B",
    type: "Xuất hàng",
    status: "pending",
    statusLabel: "Chờ xác nhận",
  },
  {
    id: "BK-2024-003",
    container: "TGHU5554321",
    date: "Ngày mai, 08:00",
    gate: "Cổng A",
    type: "Nhập hàng",
    status: "confirmed",
    statusLabel: "Đã xác nhận",
  },
];

const STATUS_COLORS: Record<string, string> = {
  confirmed: "#48bb78",
  pending: "#f6ad55",
  cancelled: "#fc5b5b",
};

export default function DriverAppointments() {
  return (
    <View style={{ flex: 1, backgroundColor: "#080808" }}>
      <LinearGradient
        colors={["rgba(99,179,237,0.12)", "transparent"]}
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
            <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>Lịch hẹn của tôi</Text>
          </View>
          <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: "rgba(99,179,237,0.15)", borderWidth: 1, borderColor: "rgba(99,179,237,0.3)" }}>
            <Text style={{ color: "#63b3ed", fontSize: 12, fontWeight: "600" }}>{APPOINTMENTS.length} lịch hẹn</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 12 }} showsVerticalScrollIndicator={false}>
        {APPOINTMENTS.map(appt => (
          <TouchableOpacity
            key={appt.id}
            style={{ borderRadius: 16, padding: 16, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" }}
          >
            {/* Top row */}
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <View style={{ width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(99,179,237,0.12)", marginRight: 12 }}>
                <MaterialCommunityIcons name="clipboard-list-outline" size={22} color="#63b3ed" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "white", fontWeight: "700", fontSize: 15 }}>{appt.container}</Text>
                <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 2 }}>{appt.id} · {appt.type}</Text>
              </View>
              <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: STATUS_COLORS[appt.status] + "20" }}>
                <Text style={{ fontSize: 11, fontWeight: "600", color: STATUS_COLORS[appt.status] }}>{appt.statusLabel}</Text>
              </View>
            </View>

            {/* Info */}
            <View style={{ flexDirection: "row", gap: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.3)" />
                <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>{appt.date}</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.3)" />
                <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>{appt.gate}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
