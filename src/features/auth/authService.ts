import { apiRequest, ApiError } from "../../lib/apiClient";
import { assertAppRole } from "./roles";
import { clearSession, isAuthUser, readSession, saveSession } from "./sessionStorage";
import type { AuthSession, AuthUser } from "./types";

interface LoginResponse { data: { token: string; user: AuthUser } }
interface MeResponse { data: { user: AuthUser } }

function validateUser(user: unknown): asserts user is AuthUser {
  if (!isAuthUser(user)) throw new Error("Thông tin tài khoản từ máy chủ không hợp lệ.");
  if (!user.isActive) throw new Error("Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.");
  assertAppRole(user.role);
}

export async function login(username: string, password: string, selectedRole: string): Promise<AuthSession> {
  const response = await apiRequest<LoginResponse>("/api/auth/login", {
    authenticated: false,
    method: "POST",
    body: JSON.stringify({ username: username.trim(), password }),
  });
  const session = response.data;
  validateUser(session?.user);
  assertAppRole(session.user.role, selectedRole);
  if (typeof session.token !== "string" || !session.token) throw new Error("Máy chủ chưa cấp token đăng nhập.");
  await saveSession(session);
  return session;
}

export async function restoreSession(): Promise<AuthSession | null> {
  const saved = await readSession();
  if (!saved) return null;
  let response: MeResponse;
  try {
    response = await apiRequest<MeResponse>("/api/auth/me", { token: saved.token });
  } catch (error) {
    if (error instanceof ApiError && [401, 403, 404].includes(error.statusCode)) {
      await clearSession();
      return null;
    }
    // Retain the stored session on a network/server failure so the user can retry.
    throw error;
  }
  try {
    validateUser(response.data?.user);
  } catch {
    await clearSession();
    return null;
  }
  const session = { token: saved.token, user: response.data.user };
  await saveSession(session);
  return session;
}
