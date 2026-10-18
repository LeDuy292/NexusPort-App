import { getDriverYardMap, listSmartRoutes, selectSmartRoute, type SmartRoute, type YardMap } from './services/smartRouteService';

const message = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback;

/** Map availability must not determine whether a driver can report readiness. */
export async function loadJourneySnapshot(bookingId?: string, containerId?: string): Promise<{
  route: SmartRoute | null; routes: SmartRoute[]; map: YardMap | null;
  error: string | null; mapWarning: string | null;
}> {
  const [routeResult, mapResult] = await Promise.allSettled([listSmartRoutes(), getDriverYardMap()]);
  const routes = routeResult.status === 'fulfilled' ? routeResult.value : [];
  const route = bookingId && containerId ? selectSmartRoute(routes, { bookingId, containerId }) || null : null;
  // The list already returns a canonical, complete route snapshot. Avoid fetching
  // the same route/map a second time on every fifteen-second refresh.
  const map = route?.navigation?.map || (mapResult.status === 'fulfilled' ? mapResult.value.map : null);
  return {
    route, routes, map,
    error: routeResult.status === 'rejected' ? message(routeResult.reason, 'Không cập nhật được hành trình.') : null,
    mapWarning: map ? null : mapResult.status === 'rejected'
      ? message(mapResult.reason, 'Không tải được sơ đồ bãi.')
      : 'Chưa tải được sơ đồ bãi đã duyệt. Bạn vẫn có thể báo sẵn sàng; chỉ di chuyển khi có lộ trình được xác nhận.',
  };
}
