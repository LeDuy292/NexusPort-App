import AsyncStorage from "@react-native-async-storage/async-storage";

// Set EXPO_PUBLIC_API_URL to the backend origin (use the computer's LAN IP on a phone).
const DEFAULT_API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";

export async function getApiBaseUrl(): Promise<string> {
  const override = await AsyncStorage.getItem("api_base_url");
  return (override || DEFAULT_API_URL).trim().replace(/\/+$/, "").replace(/\/api$/, "");
}

// Node Core owns the canonical Gate / Operation Order / Yard route data.
// Configure the LAN origin separately when running on a physical phone.
export async function getNodeCoreBaseUrl(): Promise<string> {
  const override = await AsyncStorage.getItem("node_core_base_url");
  const base = override || process.env.EXPO_PUBLIC_NODE_CORE_URL || "http://localhost:4000";
  return base.trim().replace(/\/+$/, "").replace(/\/api\/v1$/, "");
}
