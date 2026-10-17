import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { AppState } from "react-native";
import { getBookingFeed, markBookingNotificationRead } from "./bookingService";
import type { BookingFeed, BookingNotification } from "./types";
import { subscribeDriverRealtime } from "../driver/services/realtimeService";

interface BookingContextValue {
  feed: BookingFeed | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  banner: BookingNotification | null;
  dismissBanner: () => void;
  realtimeConnected: boolean;
}

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [feed, setFeed] = useState<BookingFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<BookingNotification | null>(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const seen = useRef<Set<string> | null>(null);
  const busy = useRef(false);
  const requested = useRef(false);
  const mounted = useRef(true);

  const reload = useCallback(async () => {
    if (busy.current) { requested.current = true; return; }
    busy.current = true;
    try {
      const next = await getBookingFeed();
      if (!mounted.current) return;
      const newest = seen.current && next.notifications.find((item) => !item.isRead && !seen.current!.has(item.id));
      if (newest) setBanner(newest);
      seen.current = new Set(next.notifications.map((item) => item.id));
      setFeed(next);
      setError(null);
    } catch (err) {
      if (mounted.current) setError(err instanceof Error ? err.message : "Không tải được booking.");
    } finally {
      busy.current = false;
      if (mounted.current) setLoading(false);
      if (requested.current && mounted.current) { requested.current = false; void reload(); }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void reload();
    const timer = setInterval(() => {
      if (AppState.currentState !== "background") void reload();
    }, 15000);
    let disposed = false;
    let unsubscribe: (() => void) | undefined;
    void subscribeDriverRealtime({
      onConnected: () => { if (!disposed) { setRealtimeConnected(true); void reload(); } },
      onDisconnected: () => { if (!disposed) setRealtimeConnected(false); },
      onConnectionError: () => { if (!disposed) setRealtimeConnected(false); },
      onBookingDispatchUpdated: () => { if (!disposed) void reload(); },
    }).then(cleanup => { if (disposed) cleanup(); else unsubscribe = cleanup; })
      .catch(() => { if (!disposed) setRealtimeConnected(false); });
    const subscription = AppState.addEventListener("change", (state) => { if (state === "active") void reload(); });
    return () => { disposed = true; mounted.current = false; unsubscribe?.(); clearInterval(timer); subscription.remove(); };
  }, [reload]);

  useEffect(() => {
    if (!banner) return;
    const timer = setTimeout(() => setBanner(null), 7000);
    return () => clearTimeout(timer);
  }, [banner]);

  const markRead = async (id: string) => {
    await markBookingNotificationRead(id);
    setFeed((current) => current && ({
      ...current,
      unreadCount: Math.max(0, current.unreadCount - (current.notifications.some((item) => item.id === id && !item.isRead) ? 1 : 0)),
      notifications: current.notifications.map((item) => item.id === id ? { ...item, isRead: true } : item),
    }));
  };

  return <BookingContext.Provider value={{ feed, loading, error, reload, markRead, banner, realtimeConnected, dismissBanner: () => setBanner(null) }}>{children}</BookingContext.Provider>;
}

export function useBookings() {
  const value = useContext(BookingContext);
  if (!value) throw new Error("useBookings must be used inside BookingProvider");
  return value;
}
