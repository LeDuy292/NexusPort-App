import { Stack, router, usePathname } from "expo-router";
import { BookingProvider } from "../../src/features/bookings/BookingProvider";
import { BookingNotificationBanner } from "../../src/features/bookings/components/BookingUI";
import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function DriverLayout() {
  const path = usePathname();
  const insets = useSafeAreaInsets();
  const tabs = [
    { title: "Tổng quan", path: "/(driver)", icon: "grid-outline", activeIcon: "grid", active: path === "/" || path === "/(driver)" },
    { title: "Lệnh VC", path: "/(driver)/trips", icon: "car-outline", activeIcon: "car", active: path.includes("trip") },
    { title: "Hành trình", path: "/(driver)/yard-navigation", icon: "navigate-outline", activeIcon: "navigate", active: path.includes("yard-navigation") },
    { title: "Booking", path: "/(driver)/bookings", icon: "reader-outline", activeIcon: "reader", active: path.includes("booking") || path.includes("appointments") },
    { title: "Tài khoản", path: "/(driver)/account", icon: "person-outline", activeIcon: "person", active: path.includes("account") },
  ];

  return (
    <BookingProvider>
      <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#f8fafc" },
            animation: "slide_from_right",
          }}
        />
        {/* Modern Clean White Bottom Tab Bar */}
        <View
          style={{
            flexDirection: "row",
            borderTopWidth: 1,
            borderColor: "#e2e8f0",
            backgroundColor: "#ffffff",
            paddingTop: 8,
            paddingBottom: Math.max(insets.bottom, 10),
            shadowColor: "#0f172a",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.04,
            shadowRadius: 10,
            elevation: 8,
          }}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.title}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab.active }}
              onPress={() => router.navigate(tab.path as any)}
              style={{ flex: 1, alignItems: "center", gap: 3, paddingVertical: 4 }}
            >
              <View
                style={{
                  width: 40,
                  height: 28,
                  borderRadius: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: tab.active ? "rgba(255,104,44,0.12)" : "transparent",
                }}
              >
                <Ionicons
                  name={(tab.active ? tab.activeIcon : tab.icon) as any}
                  size={20}
                  color={tab.active ? "#ff682c" : "#64748b"}
                />
              </View>
              <Text
                style={{
                  color: tab.active ? "#ff682c" : "#64748b",
                  fontWeight: tab.active ? "800" : "500",
                  fontSize: 11,
                  letterSpacing: -0.2,
                }}
              >
                {tab.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <BookingNotificationBanner />
      </View>
    </BookingProvider>
  );
}
