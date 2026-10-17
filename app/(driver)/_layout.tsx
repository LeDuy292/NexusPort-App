import { Stack } from "expo-router";
import { BookingProvider } from "../../src/features/bookings/BookingProvider";
import { BookingNotificationBanner } from "../../src/features/bookings/components/BookingUI";
import { View } from "react-native";

export default function DriverLayout() {
  return (
    <BookingProvider>
    <View style={{ flex: 1 }}>
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#080808" },
        animation: "slide_from_right",
      }}
    />
    <BookingNotificationBanner />
    </View>
    </BookingProvider>
  );
}
