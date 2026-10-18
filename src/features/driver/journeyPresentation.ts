import type { DriverBooking } from '../bookings/types';
import type { SmartRoute } from './services/smartRouteService';

export type JourneyStage = 'ready' | 'gate_in' | 'to_yard' | 'handover' | 'to_exit' | 'gate_out' | 'completed';
export const JOURNEY_STAGES: { id: JourneyStage; title: string; icon: string; description: string }[] = [
  { id: 'ready', title: 'Sẵn sàng', icon: 'checkmark-circle-outline', description: 'Đến khu chờ được phép, xác nhận sẵn sàng và nhận lệnh gọi của điều độ.' },
  { id: 'gate_in', title: 'Cổng vào', icon: 'enter-outline', description: 'Đến đúng cổng, để camera đối soát biển số với khai báo và lệnh vào cảng.' },
  { id: 'to_yard', title: 'Đến điểm nhận', icon: 'navigate-outline', description: 'Theo tuyến được phân công đến điểm giao nhận. Chỉ xác nhận đã đến khi xe ở đúng điểm.' },
  { id: 'handover', title: 'Giao / nhận hàng', icon: 'cube-outline', description: 'Chờ nhân viên bãi xử lý, kiểm tra số container, số chì và tình trạng trước khi xác nhận.' },
  { id: 'to_exit', title: 'Đến cổng ra', icon: 'return-up-forward-outline', description: 'Khi đủ container đã được xác nhận, di chuyển theo tuyến đến cổng ra. Tiếp tục dùng booking của chuyến này, không cần tạo booking mới.' },
  { id: 'gate_out', title: 'Gate Out', icon: 'exit-outline', description: 'Camera cổng ra đối soát biển số với cùng booking, lượt vào và các container đã hoàn tất. Hệ thống ghi nhận xe rời cảng sau khi qua cổng.' },
  { id: 'completed', title: 'Hoàn thành', icon: 'flag-outline', description: 'Đã ghi nhận xe rời cảng. Có thể xem lại các mốc và thông tin booking.' },
];

export function currentJourneyStage(booking?: DriverBooking | null, route?: SmartRoute | null): JourneyStage {
  const journey = route?.journey;
  if (journey?.gateOutAt || journey?.phase === 'exited') return 'completed';
  if (journey?.phase === 'ready_for_gate_out') {
    const origin = route?.navigation?.origin;
    return journey.exitGateCode && origin?.gateCode === journey.exitGateCode ? 'gate_out' : 'to_exit';
  }
  if (journey?.phase === 'at_yard') return 'handover';
  if (journey?.gateInAt || route?.gateTransactionId) return 'to_yard';
  // A consumed permission means entry was persisted even if route loading is
  // temporarily delayed. Never send an inside driver back to readiness actions.
  if (booking?.gateEntryOrder?.status === 'consumed' || ['checked_in', 'checkedin', 'completed'].includes(booking?.status.toLowerCase() || '')) return 'to_yard';
  if (booking?.gateEntryOrder?.status === 'active') return 'gate_in';
  return 'ready';
}

export function stageTimestamp(stage: JourneyStage, booking?: DriverBooking | null, route?: SmartRoute | null): string | null {
  const journey = route?.journey;
  return ({ ready: booking?.dispatch?.readyAt, gate_in: journey?.gateInAt,
    to_yard: journey?.arrivedAt, handover: journey?.containerConfirmedAt,
    to_exit: journey?.gateOutAt, gate_out: journey?.gateOutAt, completed: journey?.gateOutAt })[stage] || null;
}

export function journeyStageState(stage: JourneyStage, current: JourneyStage): 'done' | 'active' | 'pending' {
  const index = JOURNEY_STAGES.findIndex(item => item.id === stage);
  const active = JOURNEY_STAGES.findIndex(item => item.id === current);
  return current === 'completed' || index < active ? 'done' : index === active ? 'active' : 'pending';
}

export function containerProgress(booking: DriverBooking, routes: SmartRoute[]) {
  const confirmed = new Set(routes.filter(route => route.bookingId === booking.id && !!route.journey?.containerConfirmedAt).map(route => route.containerId));
  return { total: booking.containers.length,
    confirmed: booking.containers.filter(container => confirmed.has(container.id)).length,
    next: booking.containers.find(container => !confirmed.has(container.id)) || null };
}

export function bookingJourneyNotice(booking: DriverBooking): string | null {
  const status = booking.status.toLowerCase();
  if (status === 'pending') return 'Booking đang chờ duyệt. Chưa thể xác nhận sẵn sàng hoặc vào cổng.';
  if (['canceled', 'cancelled', 'rejected', 'expired'].includes(status)) return 'Booking này không còn được thực hiện. Bạn có thể xem thông tin và chọn booking khác.';
  return null;
}
