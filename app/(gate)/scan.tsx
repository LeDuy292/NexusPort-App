import { View, Text, TouchableOpacity, ScrollView, TextInput } from "react-native";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";

const VEHICLES = [
  { plate: "51G-123.45", driver: "Nguyễn Văn A", container: "MSKU1234567", booking: "BK-2024-001", status: "valid", statusLabel: "Hợp lệ" },
  { plate: "30F-456.78", driver: "Trần Văn B", container: "CMAU9876543", booking: "BK-2024-002", status: "pending", statusLabel: "Chờ xác nhận" },
  { plate: "43C-789.01", driver: "Lê Thị C", container: "TGHU5554321", booking: "BK-2024-003", status: "invalid", statusLabel: "Không hợp lệ" },
];

const STATUS_COLORS: Record<string, string> = { valid: "#48bb78", pending: "#f6ad55", invalid: "#fc5b5b" };

export default function GateScan() {
  const [query, setQuery] = useState("");
  const [scanned, setScanned] = useState<typeof VEHICLES[0] | null>(null);

  const handleScan = () => {
    setScanned(VEHICLES[0]);
    setTimeout(() => setScanned(null), 3000);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#080808" }}>
      <LinearGradient
        colors={["rgba(72,187,120,0.12)", "transparent"]}
        style={{ paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.07)" }}
          >
            <Ionicons name="arrow-back" size={18} color="white" />
          </TouchableOpacity>
          <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>Scan Xe vào cổng</Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", paddingHorizontal: 12, marginTop: 14, height: 44 }}>
          <Ionicons name="search" size={18} color="rgba(255,255,255,0.3)" />
          <TextInput
            style={{ flex: 1, color: "white", marginLeft: 8, fontSize: 14 }}
            placeholder="Nhập biển số xe..."
            placeholderTextColor="rgba(255,255,255,0.25)"
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </LinearGradient>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* Scan button */}
        <TouchableOpacity
          onPress={handleScan}
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 16, padding: 16, marginBottom: 20, backgroundColor: "rgba(72,187,120,0.12)", borderWidth: 1, borderColor: "rgba(72,187,120,0.3)" }}
        >
          <MaterialCommunityIcons name="car-search" size={22} color="#48bb78" />
          <Text style={{ color: "#48bb78", fontWeight: "700", fontSize: 15 }}>Quét QR / Biển số tự động</Text>
        </TouchableOpacity>

        {scanned && (
          <View style={{ borderRadius: 16, padding: 16, backgroundColor: "rgba(72,187,120,0.08)", borderWidth: 1, borderColor: "rgba(72,187,120,0.3)", marginBottom: 20 }}>
            <Text style={{ color: "#48bb78", fontWeight: "700", fontSize: 15, marginBottom: 8 }}>✓ Quét thành công</Text>
            <Text style={{ color: "white", fontSize: 14 }}>Biển số: <Text style={{ fontWeight: "700" }}>{scanned.plate}</Text></Text>
            <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 4 }}>Tài xế: {scanned.driver}</Text>
            <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>Booking: {scanned.booking}</Text>
          </View>
        )}

        <Text style={{ color: "white", fontWeight: "600", fontSize: 16, marginBottom: 12 }}>Xe đang chờ vào</Text>
        <View style={{ gap: 12 }}>
          {VEHICLES.filter(v => v.plate.includes(query)).map(v => (
            <TouchableOpacity
              key={v.plate}
              style={{ flexDirection: "row", alignItems: "center", borderRadius: 16, padding: 14, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" }}
            >
              <View style={{ width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(72,187,120,0.12)", marginRight: 12 }}>
                <MaterialCommunityIcons name="truck" size={22} color="#48bb78" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "white", fontWeight: "700", fontSize: 14 }}>{v.plate}</Text>
                <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 2 }}>{v.driver} · {v.container}</Text>
              </View>
              <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: STATUS_COLORS[v.status] + "20" }}>
                <Text style={{ fontSize: 11, fontWeight: "600", color: STATUS_COLORS[v.status] }}>{v.statusLabel}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
