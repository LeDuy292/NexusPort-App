import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { useState, useEffect } from "react";
import { router } from "expo-router";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";

const QUICK_ACTIONS = [
  {
    icon: "magnify" as const,
    label: "Tra cứu Container",
    subtitle: "Tìm vị trí trong bãi",
    color: "#f6ad55",
    bg: "rgba(246,173,85,0.12)",
    route: "/(yard)/container",
  },
  {
    icon: "transfer" as const,
    label: "Ghi Di chuyển",
    subtitle: "Ghi nhận dịch chuyển hàng",
    color: "#ff682c",
    bg: "rgba(255,104,44,0.12)",
    route: "/(yard)/movement",
  },
  {
    icon: "map-marker-radius" as const,
    label: "Sơ đồ bãi",
    subtitle: "Xem vị trí các block",
    color: "#63b3ed",
    bg: "rgba(99,179,237,0.12)",
    route: "/(yard)/map",
  },
  {
    icon: "alert-octagon-outline" as const,
    label: "Báo hư hỏng",
    subtitle: "Ghi nhận container hư hại",
    color: "#fc5b5b",
    bg: "rgba(252,91,91,0.12)",
    route: "/(yard)/damage",
  },
];

const RECENT_CONTAINERS = [
  {
    id: "MSKU1234567",
    location: "Block A - Row 3 - Slot 12",
    status: "available",
    statusLabel: "Sẵn sàng",
    size: "20ft",
    weight: "12,500 kg",
  },
  {
    id: "CMAU9876543",
    location: "Block B - Row 1 - Slot 5",
    status: "reserved",
    statusLabel: "Đã đặt",
    size: "40ft",
    weight: "28,000 kg",
  },
  {
    id: "TGHU5554321",
    location: "Block C - Row 7 - Slot 2",
    status: "damaged",
    statusLabel: "Hư hỏng",
    size: "20ft",
    weight: "8,200 kg",
  },
];

const STATUS_COLORS: Record<string, string> = {
  available: "#48bb78",
  reserved: "#f6ad55",
  damaged: "#fc5b5b",
};

export default function YardHome() {
  const [yardUser, setYardUser] = useState<any>(null);

  useEffect(() => {
    AsyncStorage.getItem("user").then((raw) => {
      if (raw) {
        try {
          setYardUser(JSON.parse(raw));
        } catch (e) {}
      }
    });
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem("user");
    await AsyncStorage.removeItem("token");
    router.replace("/(auth)/login");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#080808" }}>
      {/* Header */}
      <LinearGradient
        colors={["rgba(246,173,85,0.1)", "transparent"]}
        style={{ paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20 }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ width: 32, height: 32, backgroundColor: "#f6ad55", borderRadius: 8, alignItems: "center", justifyContent: "center" }}>
              <MaterialCommunityIcons name="forklift" size={16} color="white" />
            </View>
            <Text style={{ color: "white", fontWeight: "bold", fontSize: 18 }}>
              NexusPort<Text style={{ color: "#f6ad55" }}>.</Text>
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleLogout}
            style={{ width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.06)" }}
          >
            <Ionicons name="log-out-outline" size={18} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        </View>

        <View>
          <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Xin chào,</Text>
          <Text style={{ color: "white", fontSize: 24, fontWeight: "bold", marginTop: 2 }}>
            {yardUser?.fullName || yardUser?.username || "Yard Operator"} 🏗️
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: "rgba(246,173,85,0.12)", borderWidth: 1, borderColor: "rgba(246,173,85,0.2)" }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#f6ad55" }} />
            <Text style={{ color: "#f6ad55", fontSize: 12, fontWeight: "600" }}>Khu vực: Block A-C</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Tổng container", value: "248", color: "#f6ad55" },
            { label: "Sẵn sàng", value: "186", color: "#48bb78" },
            { label: "Hư hỏng", value: "5", color: "#fc5b5b" },
          ].map((stat) => (
            <View key={stat.label} style={{ flex: 1, borderRadius: 16, padding: 12, alignItems: "center", backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" }}>
              <Text style={{ color: stat.color, fontWeight: "bold", fontSize: 22 }}>{stat.value}</Text>
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 }}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={{ color: "white", fontWeight: "600", fontSize: 16, marginBottom: 12 }}>Thao tác nhanh</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={action.label}
              onPress={() => router.push(action.route as any)}
              style={({ pressed }) => ({
                width: "47%",
                backgroundColor: pressed ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.04)",
                borderWidth: 1,
                borderColor: pressed ? action.color + "40" : "rgba(255,255,255,0.06)",
                borderRadius: 16,
                padding: 14,
              })}
            >
              <View style={{ width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: action.bg, marginBottom: 12 }}>
                <MaterialCommunityIcons name={action.icon} size={22} color={action.color} />
              </View>
              <Text style={{ color: "white", fontWeight: "600", fontSize: 13 }}>{action.label}</Text>
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 }}>{action.subtitle}</Text>
            </Pressable>
          ))}
        </View>

        {/* Recent Containers */}
        <Text style={{ color: "white", fontWeight: "600", fontSize: 16, marginBottom: 12 }}>Container gần đây</Text>
        <View style={{ gap: 12 }}>
          {RECENT_CONTAINERS.map((container) => (
            <TouchableOpacity
              key={container.id}
              style={{ borderRadius: 16, padding: 14, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(246,173,85,0.12)", marginRight: 12 }}>
                  <MaterialCommunityIcons name="package-variant-closed" size={20} color="#f6ad55" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "white", fontWeight: "600", fontSize: 14 }}>{container.id}</Text>
                  <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 2 }}>{container.size} · {container.weight}</Text>
                </View>
                <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: STATUS_COLORS[container.status] + "18" }}>
                  <Text style={{ fontSize: 11, fontWeight: "600", color: STATUS_COLORS[container.status] }}>{container.statusLabel}</Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)" }}>
                <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.3)" />
                <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{container.location}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
