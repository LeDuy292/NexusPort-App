export const BOOKING_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: "Chờ duyệt", color: "#f6ad55" },
  approved: { label: "Đã duyệt", color: "#48bb78" },
  ready: { label: "Sẵn sàng vào cổng", color: "#63b3ed" },
  checked_in: { label: "Đã vào cổng", color: "#9f7aea" },
  completed: { label: "Hoàn thành", color: "#48bb78" },
  rejected: { label: "Bị từ chối", color: "#fc5b5b" },
  canceled: { label: "Đã hủy", color: "#fc5b5b" },
  expired: { label: "Hết hạn", color: "#aaa" },
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
