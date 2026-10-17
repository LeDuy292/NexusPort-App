import { io, Socket } from "socket.io-client";
import { getApiBaseUrl } from "../../../config/api";
import { readSession } from "../../auth/sessionStorage";

export interface RealtimeHandlers {
  onTripAssigned?: (data: any) => void;
  onTripStatusUpdated?: (data: any) => void;
  onBookingDispatchUpdated?: (data: { bookingId: string; version: number; eventId: string }) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onConnectionError?: (err: any) => void;
}

/**
 * Đăng ký lắng nghe sự kiện thời gian thực Socket.IO trên Mobile
 */
export async function subscribeDriverRealtime(handlers: RealtimeHandlers): Promise<() => void> {
  const token = (await readSession())?.token;
  if (!token) return () => {};

  const baseUrl = await getApiBaseUrl();
  let socket: Socket | null = null;

  try {
    socket = io(baseUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    if (handlers.onConnected) socket.on("connect", handlers.onConnected);
    if (handlers.onDisconnected) socket.on("disconnect", handlers.onDisconnected);
    if (handlers.onConnectionError) socket.on("connect_error", handlers.onConnectionError);

    if (handlers.onTripAssigned) {
      socket.on("trip:assigned", handlers.onTripAssigned);
    }
    if (handlers.onTripStatusUpdated) {
      socket.on("trip:status_updated", handlers.onTripStatusUpdated);
    }
    if (handlers.onBookingDispatchUpdated) socket.on("booking:dispatch_updated", handlers.onBookingDispatchUpdated);

    return () => {
      if (socket) {
        if (handlers.onTripAssigned) socket.off("trip:assigned", handlers.onTripAssigned);
        if (handlers.onTripStatusUpdated) socket.off("trip:status_updated", handlers.onTripStatusUpdated);
        if (handlers.onBookingDispatchUpdated) socket.off("booking:dispatch_updated", handlers.onBookingDispatchUpdated);
        if (handlers.onConnected) socket.off("connect", handlers.onConnected);
        if (handlers.onDisconnected) socket.off("disconnect", handlers.onDisconnected);
        if (handlers.onConnectionError) socket.off("connect_error", handlers.onConnectionError);
        socket.disconnect();
      }
    };
  } catch (err) {
    if (handlers.onConnectionError) handlers.onConnectionError(err);
    return () => {};
  }
}
