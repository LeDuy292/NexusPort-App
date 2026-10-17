import { getApiBaseUrl } from "../config/api";
import { clearSession, readSession } from "../features/auth/sessionStorage";

export class ApiError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = "ApiError";
  }
}

const expiredListeners = new Set<() => void>();

export function onSessionExpired(listener: () => void) {
  expiredListeners.add(listener);
  return () => { expiredListeners.delete(listener); };
}

interface RequestOptions extends RequestInit {
  authenticated?: boolean;
  token?: string;
  baseUrl?: string;
}

export async function apiRequest<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  const { authenticated = true, token: explicitToken, baseUrl, ...request } = options;
  const [base, session] = await Promise.all([
    baseUrl ? Promise.resolve(baseUrl.replace(/\/+$/, "")) : getApiBaseUrl(),
    authenticated && !explicitToken ? readSession() : Promise.resolve(null),
  ]);
  const token = explicitToken || session?.token;
  const headers = new Headers(request.headers);
  headers.set("Content-Type", "application/json");
  if (authenticated && token) headers.set("Authorization", `Bearer ${token}`);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  let response: Response;
  let body: any;
  try {
    response = await fetch(`${base}${path}`, { ...request, headers, signal: controller.signal });
    const raw = await response.text();
    try { body = raw ? JSON.parse(raw) : null; } catch { body = null; }
  } catch {
    throw new ApiError(`Không kết nối được máy chủ ${base}. Kiểm tra backend và địa chỉ API.`, 0);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok || body?.success === false) {
    if (response.status === 401 && authenticated) {
      // A slow response from a previous account must not log out a newer session.
      const current = await readSession();
      if (current?.token === token) {
        await clearSession();
        expiredListeners.forEach((listener) => listener());
      }
    }
    throw new ApiError(body?.error?.message || body?.message || `Yêu cầu thất bại (HTTP ${response.status}).`, response.status);
  }
  if (!body) throw new ApiError("Máy chủ trả về dữ liệu không hợp lệ. Kiểm tra địa chỉ API.", response.status);
  return body as T;
}
