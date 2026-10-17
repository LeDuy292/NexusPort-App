import { apiRequest } from "../../lib/apiClient";
import type { BookingFeed, DriverBooking } from "./types";

export async function getBookingFeed() {
  const response = await apiRequest<{ data: BookingFeed }>("/api/driver-bookings/feed");
  return response.data;
}

export async function getBooking(id: string) {
  const response = await apiRequest<{ data: { booking: DriverBooking } }>(`/api/driver-bookings/${encodeURIComponent(id)}`);
  return response.data.booking;
}

export async function markBookingNotificationRead(id: string) {
  await apiRequest(`/api/driver-bookings/notifications/${encodeURIComponent(id)}/read`, { method: "POST" });
}

export async function updateBookingArrival(booking: DriverBooking, action: "arrive" | "ready" | "not-ready" | "acknowledge") {
  const response = await apiRequest<{ data: { booking: DriverBooking } }>(
    "/api/booking-dispatch/" + encodeURIComponent(booking.id) + "/" + action,
    { method: "POST", body: JSON.stringify({ expectedVersion: booking.dispatch?.version || 0 }) },
  );
  return response.data.booking;
}
