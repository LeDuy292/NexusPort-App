import { View, Text, TouchableOpacity, ScrollView, TextInput } from "react-native";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";

const INCIDENT_TYPES = [
  { icon: "truck-alert", label: "Xe hỏng / kẹt", color: "#f6ad55" },
  { icon: "account-alert", label: "Tranh chấp / Gây rối", color: "#fc5b5b" },
  { icon: "package-variant-closed-remove", label: "Container hư hại", color: "#ff682c" },
  { icon: "cctv-off", label: "Camera hỏng", color: "#63b3ed" },
];

export default function GateIncident() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!selectedType) return;
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); setSelectedType(null); setDescription(""); }, 2500);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#080808" }}>
      <LinearGradient
        colors={["rgba(252,91,91,0.12)", "transparent"]}
        style={{ paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.07)" }}
          >
            <Ionicons name="arrow-back" size={18} color="white" />
          </TouchableOpacity>
          <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>Báo sự cố</Text>
        </View>
      </LinearGradient>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {submitted && (
          <View style={{ borderRadius: 14, padding: 16, backgroundColor: "rgba(72,187,120,0.1)", borderWidth: 1, borderColor: "rgba(72,187,120,0.3)", marginBottom: 16, flexDirection: "row", alignItems: "center", gap: 10 }}>
            <MaterialCommunityIcons name="check-circle" size={22} color="#48bb78" />
            <Text style={{ color: "#48bb78", fontWeight: "600", fontSize: 14 }}>Sự cố đã được ghi nhận!</Text>
          </View>
        )}

        <Text style={{ color: "white", fontWeight: "600", fontSize: 15, marginBottom: 12 }}>Loại sự cố</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
          {INCIDENT_TYPES.map(type => (
            <TouchableOpacity
              key={type.label}
              onPress={() => setSelectedType(type.label)}
              style={{
                width: "47%",
                borderRadius: 14,
                padding: 14,
                backgroundColor: selectedType === type.label ? type.color + "18" : "rgba(255,255,255,0.04)",
                borderWidth: 1,
                borderColor: selectedType === type.label ? type.color + "50" : "rgba(255,255,255,0.07)",
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <MaterialCommunityIcons name={type.icon as any} size={22} color={selectedType === type.label ? type.color : "rgba(255,255,255,0.4)"} />
              <Text style={{ color: selectedType === type.label ? "white" : "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: "500", flex: 1 }}>{type.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={{ color: "white", fontWeight: "600", fontSize: 15, marginBottom: 10 }}>Mô tả chi tiết</Text>
        <TextInput
          style={{
            backgroundColor: "rgba(255,255,255,0.05)",
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.1)",
            color: "white",
            padding: 14,
            fontSize: 14,
            minHeight: 110,
            textAlignVertical: "top",
            marginBottom: 20,
          }}
          placeholder="Nhập mô tả sự cố..."
          placeholderTextColor="rgba(255,255,255,0.25)"
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!selectedType}
          style={{
            borderRadius: 14,
            padding: 16,
            alignItems: "center",
            backgroundColor: selectedType ? "#fc5b5b" : "rgba(252,91,91,0.2)",
          }}
        >
          <Text style={{ color: "white", fontWeight: "700", fontSize: 15 }}>Gửi báo cáo sự cố</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
