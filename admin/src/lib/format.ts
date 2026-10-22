// Định dạng thời gian theo giờ Việt Nam cho giao diện quản trị.

export function timeAgo(iso: string, now: number = Date.now()): string {
  const sec = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (sec < 5) return "vừa xong";
  if (sec < 60) return `${sec} giây trước`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} phút trước`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

const timeFmt = new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Ho_Chi_Minh" });

export function clockTime(iso: string): string {
  return timeFmt.format(new Date(iso));
}

// "2026-10-22" → "22/10" (ngày đã là ngày Việt Nam do API tính sẵn)
// Tách chuỗi trực tiếp: Intl của vi-VN cho "22-10" hay "22/10" tùy trình duyệt.
export function shortDay(day: string): string {
  const [, month, date] = day.split("-");
  return `${date}/${month}`;
}

export const CLIENT_LABEL: Record<string, string> = { web: "Web", mobile: "Mobile", admin: "Web Admin" };
