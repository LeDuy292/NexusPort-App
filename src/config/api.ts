import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";

// Use Metro's LAN host when testing on a physical device.
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

interface ServiceOrigin {
  port: number;
  deployedOrigin: string;
  localOverride?: string;
  storageKey: string;
  pathSuffix: RegExp;
}

async function resolveOrigin({ port, deployedOrigin, localOverride, storageKey, pathSuffix }: ServiceOrigin): Promise<string> {
  if (Platform.OS !== "web" && !__DEV__) return deployedOrigin;

  const normalize = (origin: string) => origin.trim().replace(/\/+$/, "").replace(pathSuffix, "");
  const configuredOrigin = normalize(localOverride ?? "");
  if (configuredOrigin && configuredOrigin !== deployedOrigin) return configuredOrigin;

  const metroOrigin = expoOrigin(port);
  if (metroOrigin) return metroOrigin;

  const savedOrigin = normalize((await AsyncStorage.getItem(storageKey)) ?? "");
  return savedOrigin && savedOrigin !== deployedOrigin ? savedOrigin : localOrigin(port);
}

export function getApiBaseUrl(): Promise<string> {
  return resolveOrigin({
    port: 3001,
    deployedOrigin: "https://api.nexusport.io.vn",
    localOverride: process.env.EXPO_PUBLIC_API_URL,
    storageKey: "api_base_url",
    pathSuffix: /\/api$/,
  });
}

// Node Core owns the canonical Gate, Operation Order and Yard route data.
export function getNodeCoreBaseUrl(): Promise<string> {
  return resolveOrigin({
    port: 4000,
    deployedOrigin: "https://node-core-production.up.railway.app",
    localOverride: process.env.EXPO_PUBLIC_NODE_CORE_URL,
    storageKey: "node_core_base_url",
    pathSuffix: /\/api\/v1$/,
  });
}
