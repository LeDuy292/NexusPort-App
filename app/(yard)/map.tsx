import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";

const BLOCKS = [
  {
    id: "A",
    color: "#63b3ed",
    rows: 6,
    totalSlots: 72,
    occupied: 58,
    containers: ["MSKU1234567", "MSCU7788990", "HLCU3344556"],
  },
  {
    id: "B",
    color: "#48bb78",
    rows: 4,
    totalSlots: 48,
    occupied: 31,
    containers: ["CMAU9876543"],
  },
  {
    id: "C",
    color: "#f6ad55",
    rows: 7,
    totalSlots: 84,
    occupied: 67,
    containers: ["TGHU5554321"],
  },
  {
    id: "D",
    color: "#9f7aea",
    rows: 5,
    totalSlots: 60,
    occupied: 42,
    containers: [],
  },
];

export default function YardMap() {
  const [selected, setSelected] = useState<string | null>(null);
  const selectedBlock = BLOCKS.find(b => b.id === selected);

  return (
    <View style={{ flex: 1, backgroundColor: "#080808" }}>
      <LinearGradient
        colors={["rgba(99,179,237,0.12)", "transparent"]}
        style={{ paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.07)" }}
          >
            <Ionicons name="arrow-back" size={18} color="white" />
          </TouchableOpacity>
          <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>Sơ đồ bãi container</Text>
        </View>
      </LinearGradient>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Summary stats */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Tổng ô", value: "264", color: "#63b3ed" },
            { label: "Đang dùng", value: "198", color: "#f6ad55" },
            { label: "Trống", value: "66", color: "#48bb78" },
          ].map(s => (
            <View key={s.label} style={{ flex: 1, borderRadius: 14, padding: 12, alignItems: "center", backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" }}>
              <Text style={{ color: s.color, fontWeight: "700", fontSize: 20 }}>{s.value}</Text>
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Yard blocks visual */}
        <Text style={{ color: "white", fontWeight: "600", fontSize: 15, marginBottom: 12 }}>Chọn Block để xem chi tiết</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
          {BLOCKS.map(block => {
            const pct = Math.round((block.occupied / block.totalSlots) * 100);
            const isSelected = selected === block.id;
            return (
              <TouchableOpacity
                key={block.id}
                onPress={() => setSelected(isSelected ? null : block.id)}
                style={{
                  width: "47%",
                  borderRadius: 16,
                  padding: 14,
                  backgroundColor: isSelected ? block.color + "15" : "rgba(255,255,255,0.04)",
                  borderWidth: 1.5,
                  borderColor: isSelected ? block.color + "60" : "rgba(255,255,255,0.07)",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: block.color + "20", alignItems: "center", justifyContent: "center", marginRight: 10 }}>
                    <Text style={{ color: block.color, fontWeight: "800", fontSize: 16 }}>{block.id}</Text>
                  </View>
                  <Text style={{ color: "white", fontWeight: "700", fontSize: 15 }}>Block {block.id}</Text>
                </View>
                {/* Progress bar */}
                <View style={{ height: 6, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 3, marginBottom: 6 }}>
                  <View style={{ height: 6, width: `${pct}%`, backgroundColor: block.color, borderRadius: 3 }} />
                </View>
                <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>
                  {block.occupied}/{block.totalSlots} ô · {pct}% sử dụng
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Block detail */}
        {selectedBlock && (
          <View style={{ borderRadius: 16, padding: 16, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: selectedBlock.color + "40" }}>
            <Text style={{ color: "white", fontWeight: "700", fontSize: 16, marginBottom: 12 }}>
              Chi tiết Block {selectedBlock.id}
            </Text>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
              {[
                { label: "Số hàng", value: selectedBlock.rows.toString() },
                { label: "Tổng ô", value: selectedBlock.totalSlots.toString() },
                { label: "Đang dùng", value: selectedBlock.occupied.toString() },
              ].map(s => (
                <View key={s.label} style={{ flex: 1, borderRadius: 10, padding: 10, alignItems: "center", backgroundColor: "rgba(255,255,255,0.04)" }}>
                  <Text style={{ color: selectedBlock.color, fontWeight: "700", fontSize: 18 }}>{s.value}</Text>
                  <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{s.label}</Text>
                </View>
              ))}
            </View>
            {selectedBlock.containers.length > 0 && (
              <>
                <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 8 }}>Container trong block:</Text>
                {selectedBlock.containers.map(cid => (
                  <View key={cid} style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6 }}>
                    <MaterialCommunityIcons name="package-variant-closed" size={16} color={selectedBlock.color} />
                    <Text style={{ color: "white", fontSize: 13, fontWeight: "600" }}>{cid}</Text>
                  </View>
                ))}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
