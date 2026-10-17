import AsyncStorage from "@react-native-async-storage/async-storage";

// Set EXPO_PUBLIC_API_URL to the backend origin (use the computer's LAN IP on a phone).
const DEFAULT_API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";

export async function getApiBaseUrl(): Promise<string> {
  const override = await AsyncStorage.getItem("api_base_url");
  return (override || DEFAULT_API_URL).trim().replace(/\/+$/, "").replace(/\/api$/, "");
}
