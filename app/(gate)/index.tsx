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
    icon: "car-search" as const,
    label: "Scan Xe vào cổng",
    subtitle: "Kiểm tra biển số & booking",
    color: "#48bb78",
    bg: "rgba(72,187,120,0.12)",
    route: "/(gate)/scan",
  },
  {
    icon: "clipboard-check-outline" as const,
    label: "Danh sách Booking",
    subtitle: "Xe đã đặt lịch hôm nay",
    color: "#ff682c",
    bg: "rgba(255,104,44,0.12)",
    route: "/(gate)/bookings",
  },
  {
    icon: "cctv" as const,
    label: "Camera cổng",
    subtitle: "Xem camera trực tiếp",
    color: "#63b3ed",
    bg: "rgba(99,179,237,0.12)",
    route: "/(gate)/cameras",
  },
  {
    icon: "alert-circle-outline" as const,
    label: "Báo sự cố",
    subtitle: "Ghi nhận sự cố tại cổng",
    color: "#fc5b5b",
    bg: "rgba(252,91,91,0.12)",
    route: "/(gate)/incident",
  },
];

const RECENT_VEHICLES = [
  {
    plate: "51G-123.45",
    driver: "Nguyễn Văn A",
    status: "in",
    statusLabel: "Đã vào",
    time: "10:32",
    container: "MSKU1234567",
  },
  {
    plate: "30F-456.78",
    driver: "Trần Văn B",
    status: "out",
    statusLabel: "Đã ra",
    time: "10:15",
    container: "CMAU9876543",
  },
  {
    plate: "43C-789.01",
    driver: "Lê Thị C",
    status: "pending",
    statusLabel: "Chờ xử lý",
    time: "10:05",
    container: "TGHU5554321",
  },
];

const STATUS_COLORS: Record<string, string> = {
  in: "#48bb78",
  out: "#63b3ed",
  pending: "#f6ad55",
};

export default function GateHome() {
  const [gateUser, setGateUser] = useState<any>(null);

  useEffect(() => {
    AsyncStorage.getItem("user").then((raw) => {
      if (raw) {
        try {
          setGateUser(JSON.parse(raw));
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
        colors={["rgba(72,187,120,0.1)", "transparent"]}
        style={{ paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20 }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ width: 32, height: 32, backgroundColor: "#48bb78", borderRadius: 8, alignItems: "center", justifyContent: "center" }}>
              <MaterialCommunityIcons name="shield-check" size={16} color="white" />
            </View>
            <Text style={{ color: "white", fontWeight: "bold", fontSize: 18 }}>
              NexusPort<Text style={{ color: "#48bb78" }}>.</Text>
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
            {gateUser?.fullName || gateUser?.username || "Gate Officer"} 👮
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: "rgba(72,187,120,0.12)", borderWidth: 1, borderColor: "rgba(72,187,120,0.2)" }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#48bb78" }} />
            <Text style={{ color: "#48bb78", fontSize: 12, fontWeight: "600" }}>Ca làm việc: 08:00 - 16:00</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Xe vào", value: "24", color: "#48bb78" },
            { label: "Xe ra", value: "18", color: "#63b3ed" },
            { label: "Chờ xử lý", value: "3", color: "#f6ad55" },
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

        {/* Recent Vehicles */}
        <Text style={{ color: "white", fontWeight: "600", fontSize: 16, marginBottom: 12 }}>Xe gần đây</Text>
        <View style={{ gap: 12 }}>
          {RECENT_VEHICLES.map((vehicle) => (
            <TouchableOpacity
              key={vehicle.plate}
              style={{ flexDirection: "row", alignItems: "center", borderRadius: 16, padding: 14, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(72,187,120,0.12)", marginRight: 12 }}>
                <MaterialCommunityIcons name="truck" size={20} color="#48bb78" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "white", fontWeight: "600", fontSize: 14 }}>{vehicle.plate}</Text>
                <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 2 }}>
                  {vehicle.driver} · {vehicle.container} · {vehicle.time}
                </Text>
              </View>
              <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: STATUS_COLORS[vehicle.status] + "18" }}>
                <Text style={{ fontSize: 11, fontWeight: "600", color: STATUS_COLORS[vehicle.status] }}>{vehicle.statusLabel}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
