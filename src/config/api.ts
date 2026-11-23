import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";

// Set EXPO_PUBLIC_API_URL to the backend origin (use the computer's LAN IP on a phone).
function expoOrigin(port: number): string | null {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    try {
      const url = new URL(hostUri.includes("://") ? hostUri : `http://${hostUri}`);
      if (url.protocol === "http:" || url.protocol === "https:") {
        url.port = String(port);
        return url.origin;
      }
    } catch { /* Fall back to the platform's local development host. */ }
  }
  return null;
}
const localOrigin = (port: number) => `http://${Platform.OS === "android" ? "10.0.2.2" : "localhost"}:${port}`;

export async function getApiBaseUrl(): Promise<string> {
  const override = await AsyncStorage.getItem("api_base_url");
  return (process.env.EXPO_PUBLIC_API_URL?.trim() || expoOrigin(3001) || override || localOrigin(3001))
    .trim().replace(/\/+$/, "").replace(/\/api$/, "");
}

// Node Core owns the canonical Gate / Operation Order / Yard route data.
// Configure the LAN origin separately when running on a physical phone.
export async function getNodeCoreBaseUrl(): Promise<string> {
  const override = await AsyncStorage.getItem("node_core_base_url");
  const base = process.env.EXPO_PUBLIC_NODE_CORE_URL?.trim() || expoOrigin(4000) || override || localOrigin(4000);
  return base.trim().replace(/\/+$/, "").replace(/\/api\/v1$/, "");
}
