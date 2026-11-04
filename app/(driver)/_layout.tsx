import { Stack, router, usePathname } from "expo-router";
import { BookingProvider } from "../../src/features/bookings/BookingProvider";
import { BookingNotificationBanner } from "../../src/features/bookings/components/BookingUI";
import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DriverLayout() {
  const path = usePathname();
  const insets = useSafeAreaInsets();
  const tabs = [
    { title: 'Tổng quan', path: '/(driver)', icon: 'home-outline', active: path === '/' || path === '/(driver)' },
    { title: 'Lệnh VC', path: '/(driver)/trips', icon: 'truck-outline', active: path.includes('trip') },
    { title: 'Hành trình', path: '/(driver)/yard-navigation', icon: 'navigate-outline', active: path.includes('yard-navigation') },
    { title: 'Booking', path: '/(driver)/bookings', icon: 'reader-outline', active: path.includes('booking') || path.includes('appointments') },
    { title: 'Tài khoản', path: '/(driver)/account', icon: 'person-circle-outline', active: path.includes('account') },
  ];
  return (
    <BookingProvider>
      <View style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#f4f6f8" },
            animation: "slide_from_right",
          }}
        />
        <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff', paddingTop: 10, paddingBottom: Math.max(insets.bottom, 10) }}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.title}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab.active }}
              onPress={() => router.navigate(tab.path as any)}
              style={{ flex: 1, alignItems: 'center', gap: 4, paddingVertical: 3 }}
            >
              <Ionicons name={tab.icon as any} size={22} color={tab.active ? '#ff682c' : '#64748b'} />
              <Text style={{ color: tab.active ? '#ff682c' : '#64748b', fontWeight: tab.active ? '800' : '500', fontSize: 10 }}>
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
