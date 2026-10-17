import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { AuthProvider, useAuth } from "../src/features/auth/AuthProvider";

export default function RootLayout() {
  return <AuthProvider><AuthenticatedStack /></AuthProvider>;
}

function AuthenticatedStack() {
  const { user, loading, error, retry, signOut } = useAuth();
  if (loading || error) {
    return (
      <View style={{ flex: 1, backgroundColor: "#080808", alignItems: "center", justifyContent: "center", padding: 24, gap: 16 }}>
        <StatusBar style="light" />
        {loading ? <ActivityIndicator color="#ff682c" /> : <>
          <Text style={{ color: "white", textAlign: "center" }}>{error}</Text>
          <TouchableOpacity onPress={() => void retry()}><Text style={{ color: "#ff682c" }}>Thử kết nối lại</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => void signOut()}><Text style={{ color: "white" }}>Đăng nhập lại</Text></TouchableOpacity>
        </>}
      </View>
    );
  }
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
        <Stack.Protected guard={!user}>
          <Stack.Screen name="(auth)/login" />
        </Stack.Protected>
        <Stack.Protected guard={user?.role === "Driver"}>
          <Stack.Screen name="(driver)" options={{ animation: "slide_from_right" }} />
        </Stack.Protected>
        <Stack.Protected guard={user?.role === "Gate Officer"}>
          <Stack.Screen name="(gate)" options={{ animation: "slide_from_right" }} />
        </Stack.Protected>
        <Stack.Protected guard={user?.role === "Yard Operator" || user?.role === "Berth Staff"}>
          <Stack.Screen name="(yard)" options={{ animation: "slide_from_right" }} />
        </Stack.Protected>
      </Stack>
    </>
  );
}
