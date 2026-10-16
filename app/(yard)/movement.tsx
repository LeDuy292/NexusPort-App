import { View, Text, TouchableOpacity, ScrollView, TextInput } from "react-native";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";

const MOVES = [
  { id: "MOV-001", container: "MSKU1234567", from: "Block A - Row 3 - Slot 12", to: "Block D - Row 1 - Slot 4", time: "09:30 hôm nay", status: "done" },
  { id: "MOV-002", container: "CMAU9876543", from: "Block B - Row 1 - Slot 5", to: "Cổng A (Xuất)", time: "10:15 hôm nay", status: "inprogress" },
  { id: "MOV-003", container: "HLCU3344556", from: "Cổng B (Nhập)", to: "Block C - Row 4 - Slot 7", time: "Hôm qua 14:00", status: "done" },
];

const STATUS_COLORS: Record<string, string> = { done: "#48bb78", inprogress: "#63b3ed" };
const STATUS_LABELS: Record<string, string> = { done: "Hoàn thành", inprogress: "Đang thực hiện" };

export default function YardMovement() {
  const [showForm, setShowForm] = useState(false);
  const [containerInput, setContainerInput] = useState("");
  const [fromInput, setFromInput] = useState("");
  const [toInput, setToInput] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!containerInput || !fromInput || !toInput) return;
    setSubmitted(true);
    setShowForm(false);
    setContainerInput(""); setFromInput(""); setToInput("");
    setTimeout(() => setSubmitted(false), 2500);
  };

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
            <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>Ghi Di chuyển</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowForm(!showForm)}
            style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, backgroundColor: "rgba(255,104,44,0.15)", borderWidth: 1, borderColor: "rgba(255,104,44,0.3)" }}
          >
            <Text style={{ color: "#ff682c", fontWeight: "600", fontSize: 13 }}>+ Thêm</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {submitted && (
          <View style={{ borderRadius: 14, padding: 14, backgroundColor: "rgba(72,187,120,0.1)", borderWidth: 1, borderColor: "rgba(72,187,120,0.3)", marginBottom: 14, flexDirection: "row", alignItems: "center", gap: 10 }}>
            <MaterialCommunityIcons name="check-circle" size={20} color="#48bb78" />
            <Text style={{ color: "#48bb78", fontWeight: "600" }}>Di chuyển đã được ghi nhận!</Text>
          </View>
        )}

        {showForm && (
          <View style={{ borderRadius: 16, padding: 16, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,104,44,0.2)", marginBottom: 20 }}>
            <Text style={{ color: "white", fontWeight: "700", fontSize: 15, marginBottom: 14 }}>Ghi nhận di chuyển mới</Text>
            {[
              { placeholder: "Mã container (VD: MSKU1234567)", value: containerInput, setter: setContainerInput },
              { placeholder: "Vị trí xuất phát", value: fromInput, setter: setFromInput },
              { placeholder: "Vị trí đích đến", value: toInput, setter: setToInput },
            ].map((field, i) => (
              <TextInput
                key={i}
                style={{ backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", color: "white", paddingHorizontal: 12, height: 44, marginBottom: 10, fontSize: 13 }}
                placeholder={field.placeholder}
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={field.value}
                onChangeText={field.setter}
              />
            ))}
            <TouchableOpacity
              onPress={handleSubmit}
              style={{ borderRadius: 12, padding: 14, alignItems: "center", backgroundColor: "#ff682c" }}
            >
              <Text style={{ color: "white", fontWeight: "700", fontSize: 14 }}>Xác nhận ghi nhận</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={{ color: "white", fontWeight: "600", fontSize: 15, marginBottom: 12 }}>Lịch sử di chuyển</Text>
        <View style={{ gap: 12 }}>
          {MOVES.map(m => (
            <View key={m.id} style={{ borderRadius: 16, padding: 14, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,104,44,0.12)", marginRight: 12 }}>
                  <MaterialCommunityIcons name="transfer" size={20} color="#ff682c" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "white", fontWeight: "700", fontSize: 14 }}>{m.container}</Text>
                  <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 }}>{m.id} · {m.time}</Text>
                </View>
                <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: STATUS_COLORS[m.status] + "20" }}>
                  <Text style={{ fontSize: 11, fontWeight: "600", color: STATUS_COLORS[m.status] }}>{STATUS_LABELS[m.status]}</Text>
                </View>
              </View>
              <View style={{ paddingTop: 10, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)", gap: 4 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="arrow-up-circle-outline" size={14} color="rgba(255,255,255,0.3)" />
                  <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>Từ: {m.from}</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="arrow-down-circle-outline" size={14} color="rgba(255,255,255,0.3)" />
                  <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>Đến: {m.to}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
