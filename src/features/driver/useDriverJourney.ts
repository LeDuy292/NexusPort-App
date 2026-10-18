import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type { SmartRoute, YardMap } from './services/smartRouteService';
import { loadJourneySnapshot } from './journeySnapshot';
import { subscribeYardRealtime } from './services/realtimeService';

export function useDriverJourney(bookingId?: string, containerId?: string) {
  const [snapshot, setSnapshot] = useState<{ key: string; route: SmartRoute | null; routes: SmartRoute[]; at: string } | null>(null);
  const [map, setMap] = useState<YardMap | null>(null);
  const [mapWarning, setMapWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [connected, setConnected] = useState(false);
  const scope = `${bookingId || ''}:${containerId || ''}`;
  const current = useRef(scope);
  current.current = scope;
  const mounted = useRef(true);
  const busy = useRef(false);
  const requested = useRef(false);
  const mutation = useRef(0);
  const mutating = useRef(false);
  const latest = useRef<() => Promise<void>>(async () => {});

  const reload = useCallback(async () => {
    if (busy.current || mutating.current) { requested.current = true; return; }
    const revision = mutation.current;
    busy.current = true;
    setRefreshing(true);
    try {
      const result = await loadJourneySnapshot(bookingId, containerId);
      if (!mounted.current || current.current !== scope || revision !== mutation.current) return;
      if (result.map) setMap(result.map);
      setMapWarning(result.mapWarning);
      if (!result.error) setSnapshot({ key: scope, route: result.route, routes: result.routes, at: new Date().toISOString() });
      setError(result.error);
    } catch (err) {
      if (mounted.current && current.current === scope && revision === mutation.current) setError(err instanceof Error ? err.message : 'Không cập nhật được hành trình.');
    } finally {
      busy.current = false;
      if (mounted.current) {
        setRefreshing(false);
        if (requested.current || current.current !== scope) { requested.current = false; void latest.current(); }
      }
    }
  }, [scope, bookingId, containerId]);
  latest.current = reload;

  useEffect(() => {
    mounted.current = true;
    setError(null);
    void reload();
    return () => { mounted.current = false; };
  }, [reload]);

  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;
    const timer = setInterval(() => { if (AppState.currentState === 'active') void latest.current(); }, 15000);
    const app = AppState.addEventListener('change', state => { if (state === 'active') void latest.current(); });
    void subscribeYardRealtime(() => { if (!disposed) void latest.current(); }, value => { if (!disposed) setConnected(value); })
      .then(fn => { if (disposed) fn(); else cleanup = fn; }).catch(() => { if (!disposed) setConnected(false); });
    return () => { disposed = true; clearInterval(timer); app.remove(); cleanup?.(); };
  }, []);

  const mutate = async (operation: () => Promise<SmartRoute>) => {
    if (mutating.current) throw new Error('Đang cập nhật hành trình.');
    mutating.current = true; mutation.current++;
    try {
      const route = await operation();
      mutation.current++;
      if (mounted.current && current.current === scope) {
        setSnapshot(previous => ({ key: scope, route,
          routes: [...(previous?.key === scope ? previous.routes : []).filter(item => item.bookingId !== route.bookingId || item.containerId !== route.containerId), route],
          at: new Date().toISOString() }));
        if (route.navigation?.map) { setMap(route.navigation.map); setMapWarning(null); }
        setError(null);
      }
      return route;
    } finally {
      mutating.current = false;
      if (mounted.current) void latest.current();
    }
  };

  return { route: snapshot?.key === scope ? snapshot.route : null, routes: snapshot?.key === scope ? snapshot.routes : [], map, mapWarning,
    updatedAt: snapshot?.key === scope ? snapshot.at : null, loading: snapshot?.key !== scope,
    refreshing, error, connected, reload, mutate };
}
