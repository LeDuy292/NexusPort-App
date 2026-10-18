export const BOOKING_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: "Chờ duyệt", color: "#a16207" },
  approved: { label: "Đã duyệt", color: "#15803d" },
  ready: { label: "Sẵn sàng vào cổng", color: "#0369a1" },
  checked_in: { label: "Đã vào cổng", color: "#7c3aed" },
  completed: { label: "Xong giao nhận", color: "#15803d" },
  rejected: { label: "Bị từ chối", color: "#b91c1c" },
  canceled: { label: "Đã hủy", color: "#b91c1c" },
  expired: { label: "Hết hạn", color: "#64748b" },
};

export const isApproved = (status: string) => ["approved", "ready"].includes(status.toLowerCase());
export const bookingTypeLabel = (type: string) => type.toLowerCase() === "dropoff" ? "Hạ container" : "Nhận container";

export function bookingTime(value?: string | null) {
  if (!value) return "Chưa có";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Chưa có" : date.toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}
