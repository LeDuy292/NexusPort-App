import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#080808" },
          animation: "fade",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(driver)" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="(gate)" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="(yard)" options={{ animation: "slide_from_right" }} />
      </Stack>
    </>
  );
}
