import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";

const QUICK_ACTIONS = [
  {
    icon: "truck-fast" as const,
    label: "Chuyến vận chuyển",
    subtitle: "Quản lý lệnh vận chuyển",
    color: "#ff682c",
    bg: "rgba(255,104,44,0.12)",
    route: "/(driver)/trips",
  },
  {
    icon: "qrcode-scan" as const,
    label: "QR Check-in",
    subtitle: "Quét mã vào cổng",
    color: "#9f7aea",
    bg: "rgba(159,122,234,0.12)",
    route: "/(driver)/qr-checkin",
  },
  {
    icon: "map-marker-radius" as const,
    label: "Vị trí Container",
    subtitle: "Tìm vị trí hàng hóa",
    color: "#48bb78",
    bg: "rgba(72,187,120,0.12)",
    route: "/(driver)/container",
  },
  {
    icon: "history" as const,
    label: "Lịch sử",
    subtitle: "Giao dịch gần đây",
    color: "#f6ad55",
    bg: "rgba(246,173,85,0.12)",
    route: "/(driver)/history",
  },
];

const RECENT_TRANSACTIONS = [
  {
    id: "TRX-2891",
    container: "MSKU1234567",
    status: "completed",
    statusLabel: "Hoàn thành",
    time: "09:45 hôm nay",
    gate: "Cổng A",
  },
  {
    id: "TRX-2890",
    container: "CMAU9876543",
    status: "pending",
    statusLabel: "Chờ xử lý",
    time: "08:20 hôm nay",
    gate: "Cổng B",
  },
  {
    id: "TRX-2889",
    container: "TGHU5554321",
    status: "completed",
    statusLabel: "Hoàn thành",
    time: "Hôm qua",
    gate: "Cổng A",
  },
];

const STATUS_COLORS: Record<string, string> = {
  completed: "#48bb78",
  pending: "#f6ad55",
  rejected: "#fc5b5b",
};

export default function DriverHome() {
  const handleLogout = async () => {
    await AsyncStorage.removeItem("user");
    router.replace("/(auth)/login");
  };

  return (
    <View className="flex-1 bg-carbon">
      {/* Header */}
      <LinearGradient
        colors={["rgba(255,104,44,0.1)", "transparent"]}
        className="pt-14 pb-6 px-5"
      >
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-2">
            <View className="w-8 h-8 bg-signal rounded-lg items-center justify-center">
              <MaterialCommunityIcons name="anchor" size={16} color="white" />
            </View>
            <Text className="text-white font-bold text-lg">
              NexusPort<Text className="text-signal">.</Text>
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleLogout}
            className="w-9 h-9 rounded-xl items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
          >
            <Ionicons name="log-out-outline" size={18} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        </View>

        <View>
          <Text className="text-white/50 text-sm">Xin chào,</Text>
          <Text className="text-white text-2xl font-bold mt-0.5">Nguyễn Văn A 👋</Text>
          <View
            className="flex-row items-center gap-1.5 mt-2 self-start px-3 py-1.5 rounded-full"
            style={{ backgroundColor: "rgba(72,187,120,0.12)", borderWidth: 1, borderColor: "rgba(72,187,120,0.2)" }}
          >
            <View className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <Text className="text-green-400 text-xs font-semibold">Đang trực tuyến</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-8"
        showsVerticalScrollIndicator={false}
      >
        {/* Stats row */}
        <View className="flex-row gap-3 mb-6">
          {[
            { label: "Hôm nay", value: "3", unit: "chuyến" },
            { label: "Tuần này", value: "14", unit: "chuyến" },
            { label: "Đánh giá", value: "4.9", unit: "★" },
          ].map((stat) => (
            <View
              key={stat.label}
              className="flex-1 rounded-2xl p-3 items-center"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" }}
            >
              <Text className="text-white font-bold text-xl">{stat.value}<Text className="text-signal text-sm"> {stat.unit}</Text></Text>
              <Text className="text-white/40 text-xs mt-0.5">{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick actions */}
        <Text className="text-white font-semibold text-base mb-3">Thao tác nhanh</Text>
        <View className="flex-row flex-wrap gap-3 mb-6">
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
              <View
                className="w-11 h-11 rounded-xl items-center justify-center mb-3"
                style={{ backgroundColor: action.bg }}
              >
                <MaterialCommunityIcons name={action.icon} size={22} color={action.color} />
              </View>
              <Text className="text-white font-semibold text-sm">{action.label}</Text>
              <Text className="text-white/40 text-xs mt-0.5">{action.subtitle}</Text>
            </Pressable>
          ))}
        </View>

        {/* Recent transactions */}
        <Text className="text-white font-semibold text-base mb-3">Giao dịch gần đây</Text>
        <View className="gap-3">
          {RECENT_TRANSACTIONS.map((txn) => (
            <TouchableOpacity
              key={txn.id}
              className="flex-row items-center rounded-2xl p-4"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" }}
            >
              <View
                className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                style={{ backgroundColor: "rgba(255,104,44,0.12)" }}
              >
                <MaterialCommunityIcons name="package-variant" size={20} color="#ff682c" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold text-sm">{txn.container}</Text>
                <Text className="text-white/40 text-xs mt-0.5">
                  {txn.id} · {txn.gate} · {txn.time}
                </Text>
              </View>
              <View
                className="px-2.5 py-1 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[txn.status] + "18" }}
              >
                <Text className="text-xs font-semibold" style={{ color: STATUS_COLORS[txn.status] }}>
                  {txn.statusLabel}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
