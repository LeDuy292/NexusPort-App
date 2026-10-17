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
