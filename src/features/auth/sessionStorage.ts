import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AuthSession, AuthUser } from "./types";

// Keep the existing key to migrate old demo sessions and share the token with Socket.IO.
const SESSION_KEY = "user";

export function isAuthUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== "object") return false;
  const user = value as AuthUser;
  return typeof user.id === "string" && !!user.id
    && typeof user.username === "string" && !!user.username
    && typeof user.role === "string" && typeof user.isActive === "boolean";
}

export async function clearSession() {
  await AsyncStorage.removeItem(SESSION_KEY);
  await AsyncStorage.removeItem("token");
}

export async function readSession(): Promise<AuthSession | null> {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const { token, ...user } = JSON.parse(raw);
    if (typeof token === "string" && token && isAuthUser(user)) return { token, user };
  } catch {
    // Invalid JSON and old demo sessions must never grant access.
  }
  await clearSession();
  return null;
}

export async function saveSession(session: AuthSession) {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ ...session.user, token: session.token }));
  await AsyncStorage.setItem("token", session.token);
}

