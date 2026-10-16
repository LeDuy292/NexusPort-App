import { View, Text, TouchableOpacity, ScrollView, TextInput } from "react-native";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";

const DAMAGE_TYPES = [
  { icon: "car-door-lock", label: "Hư khóa cửa", color: "#f6ad55" },
  { icon: "water-alert", label: "Ẩm mốc / Nước thấm", color: "#63b3ed" },
  { icon: "hammer", label: "Móp, bẹp, biến dạng", color: "#fc5b5b" },
  { icon: "fire-alert", label: "Cháy / Ô nhiễm", color: "#ff682c" },
];

export default function YardDamage() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [containerInput, setContainerInput] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!selectedType || !containerInput) return;
    setSubmitted(true);
    setSelectedType(null);
    setContainerInput("");
    setDescription("");
    setTimeout(() => setSubmitted(false), 2500);
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
          <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>Báo hư hỏng Container</Text>
        </View>
      </LinearGradient>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {submitted && (
          <View style={{ borderRadius: 14, padding: 14, backgroundColor: "rgba(72,187,120,0.1)", borderWidth: 1, borderColor: "rgba(72,187,120,0.3)", marginBottom: 16, flexDirection: "row", alignItems: "center", gap: 10 }}>
            <MaterialCommunityIcons name="check-circle" size={20} color="#48bb78" />
            <Text style={{ color: "#48bb78", fontWeight: "600" }}>Báo cáo hư hỏng đã được gửi!</Text>
          </View>
        )}

        {/* Container ID */}
        <Text style={{ color: "white", fontWeight: "600", fontSize: 15, marginBottom: 10 }}>Mã container</Text>
        <TextInput
          style={{
            backgroundColor: "rgba(255,255,255,0.05)",
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.1)",
            color: "white",
            paddingHorizontal: 14,
            height: 46,
            fontSize: 14,
            marginBottom: 20,
          }}
          placeholder="VD: MSKU1234567"
          placeholderTextColor="rgba(255,255,255,0.25)"
          value={containerInput}
          onChangeText={setContainerInput}
          autoCapitalize="characters"
        />

        {/* Damage types */}
        <Text style={{ color: "white", fontWeight: "600", fontSize: 15, marginBottom: 12 }}>Loại hư hỏng</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
          {DAMAGE_TYPES.map(type => (
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
              <MaterialCommunityIcons name={type.icon as any} size={22} color={selectedType === type.label ? type.color : "rgba(255,255,255,0.35)"} />
              <Text style={{ color: selectedType === type.label ? "white" : "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: "500", flex: 1 }}>{type.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Description */}
        <Text style={{ color: "white", fontWeight: "600", fontSize: 15, marginBottom: 10 }}>Mô tả chi tiết</Text>
        <TextInput
          style={{
            backgroundColor: "rgba(255,255,255,0.05)",
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.1)",
            color: "white",
            padding: 14,
            fontSize: 14,
            minHeight: 100,
            textAlignVertical: "top",
            marginBottom: 24,
          }}
          placeholder="Mô tả hư hỏng chi tiết..."
          placeholderTextColor="rgba(255,255,255,0.25)"
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!selectedType || !containerInput}
          style={{
            borderRadius: 14,
            padding: 16,
            alignItems: "center",
            backgroundColor: selectedType && containerInput ? "#fc5b5b" : "rgba(252,91,91,0.2)",
          }}
        >
          <Text style={{ color: "white", fontWeight: "700", fontSize: 15 }}>Gửi báo cáo hư hỏng</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
