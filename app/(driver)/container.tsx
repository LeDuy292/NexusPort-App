import { View, Text, TouchableOpacity, ScrollView, TextInput } from "react-native";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";

const CONTAINERS = [
  { id: "MSKU1234567", location: "Block A - Row 3 - Slot 12", status: "available", statusLabel: "Sẵn sàng", size: "20ft", weight: "12,500 kg" },
  { id: "CMAU9876543", location: "Block B - Row 1 - Slot 5", status: "reserved", statusLabel: "Đã đặt", size: "40ft", weight: "28,000 kg" },
  { id: "TGHU5554321", location: "Block C - Row 7 - Slot 2", status: "transit", statusLabel: "Đang vận chuyển", size: "20ft", weight: "8,200 kg" },
  { id: "MSCU7788990", location: "Block A - Row 5 - Slot 8", status: "available", statusLabel: "Sẵn sàng", size: "40ft", weight: "22,100 kg" },
];

const STATUS_COLORS: Record<string, string> = {
  available: "#48bb78",
  reserved: "#f6ad55",
  transit: "#63b3ed",
};

export default function DriverContainer() {
  const [query, setQuery] = useState("");
  const filtered = CONTAINERS.filter(c => c.id.toLowerCase().includes(query.toLowerCase()));

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
          <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>Vị trí Container</Text>
        </View>

        {/* Search bar */}
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", paddingHorizontal: 12, marginTop: 16, height: 44 }}>
          <Ionicons name="search" size={18} color="rgba(255,255,255,0.3)" />
          <TextInput
            style={{ flex: 1, color: "white", marginLeft: 8, fontSize: 14 }}
            placeholder="Nhập mã container..."
            placeholderTextColor="rgba(255,255,255,0.25)"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="characters"
          />
        </View>
      </LinearGradient>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 12 }} showsVerticalScrollIndicator={false}>
        {filtered.map(c => (
          <TouchableOpacity
            key={c.id}
            style={{ borderRadius: 16, padding: 16, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              <View style={{ width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(72,187,120,0.12)", marginRight: 12 }}>
                <MaterialCommunityIcons name="package-variant-closed" size={22} color="#48bb78" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "white", fontWeight: "700", fontSize: 15 }}>{c.id}</Text>
                <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 2 }}>{c.size} · {c.weight}</Text>
              </View>
              <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: STATUS_COLORS[c.status] + "20" }}>
                <Text style={{ fontSize: 11, fontWeight: "600", color: STATUS_COLORS[c.status] }}>{c.statusLabel}</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)" }}>
              <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.3)" />
              <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>{c.location}</Text>
            </View>
          </TouchableOpacity>
        ))}
        {filtered.length === 0 && (
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <MaterialCommunityIcons name="package-variant-closed-remove" size={52} color="rgba(255,255,255,0.1)" />
            <Text style={{ color: "rgba(255,255,255,0.3)", marginTop: 12 }}>Không tìm thấy container</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
