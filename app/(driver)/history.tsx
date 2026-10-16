import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const HISTORY = [
  { id: "TRX-2891", container: "MSKU1234567", type: "Nhập hàng", gate: "Cổng A", time: "09:45 hôm nay", status: "completed", statusLabel: "Hoàn thành" },
  { id: "TRX-2890", container: "CMAU9876543", type: "Xuất hàng", gate: "Cổng B", time: "08:20 hôm nay", status: "completed", statusLabel: "Hoàn thành" },
  { id: "TRX-2887", container: "TGHU5554321", type: "Nhập hàng", gate: "Cổng A", time: "Hôm qua 15:10", status: "completed", statusLabel: "Hoàn thành" },
  { id: "TRX-2880", container: "MSCU7788990", type: "Xuất hàng", gate: "Cổng B", time: "Hôm qua 10:30", status: "rejected", statusLabel: "Bị từ chối" },
  { id: "TRX-2875", container: "HLCU3344556", type: "Nhập hàng", gate: "Cổng A", time: "2 ngày trước", status: "completed", statusLabel: "Hoàn thành" },
];

const STATUS_COLORS: Record<string, string> = {
  completed: "#48bb78",
  rejected: "#fc5b5b",
  pending: "#f6ad55",
};

export default function DriverHistory() {
  return (
    <View style={{ flex: 1, backgroundColor: "#080808" }}>
      <LinearGradient
        colors={["rgba(246,173,85,0.12)", "transparent"]}
        style={{ paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.07)" }}
          >
            <Ionicons name="arrow-back" size={18} color="white" />
          </TouchableOpacity>
          <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>Lịch sử giao dịch</Text>
        </View>
      </LinearGradient>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 12 }} showsVerticalScrollIndicator={false}>
        {HISTORY.map(txn => (
          <TouchableOpacity
            key={txn.id}
            style={{ flexDirection: "row", alignItems: "center", borderRadius: 16, padding: 14, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" }}
          >
            <View style={{ width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(246,173,85,0.12)", marginRight: 12 }}>
              <MaterialCommunityIcons name="history" size={22} color="#f6ad55" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "white", fontWeight: "600", fontSize: 14 }}>{txn.container}</Text>
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 2 }}>
                {txn.id} · {txn.type} · {txn.gate}
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 2 }}>{txn.time}</Text>
            </View>
            <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: STATUS_COLORS[txn.status] + "20" }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: STATUS_COLORS[txn.status] }}>{txn.statusLabel}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
