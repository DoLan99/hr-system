/**
 * Bộ phân giải User-Agent tối giản (không cần thư viện ngoài).
 * Chỉ nhận diện các trình duyệt/OS phổ biến. Đủ dùng cho thống kê cơ bản;
 * nếu cần độ chính xác cao hơn có thể thay bằng `ua-parser-js`.
 */

export interface ParsedUserAgent {
  device: string;
  browser: string;
  os: string;
}

const UNKNOWN: ParsedUserAgent = { device: "unknown", browser: "unknown", os: "unknown" };

export function parseUserAgent(ua: string | null | undefined): ParsedUserAgent {
  if (!ua) return UNKNOWN;
  const lower = ua.toLowerCase();

  // OS
  let os = "unknown";
  if (lower.includes("windows nt")) os = "Windows";
  else if (lower.includes("mac os x") || lower.includes("macintosh")) os = "macOS";
  else if (lower.includes("android")) os = "Android";
  else if (lower.includes("iphone") || lower.includes("ipad") || lower.includes("ios")) os = "iOS";
  else if (lower.includes("linux")) os = "Linux";

  // Device
  let device = "Desktop";
  if (lower.includes("mobile") || lower.includes("iphone") || (lower.includes("android") && !lower.includes("tablet"))) {
    device = "Mobile";
  } else if (lower.includes("ipad") || lower.includes("tablet")) {
    device = "Tablet";
  }

  // Browser — kiểm tra theo thứ tự (Edge/Opera trước Chrome vì UA của chúng cũng chứa "chrome")
  let browser = "unknown";
  if (lower.includes("edg/")) browser = "Edge";
  else if (lower.includes("opr/") || lower.includes("opera")) browser = "Opera";
  else if (lower.includes("firefox/")) browser = "Firefox";
  else if (lower.includes("chrome/")) browser = "Chrome";
  else if (lower.includes("safari/") && !lower.includes("chrome/")) browser = "Safari";

  return { device, browser, os };
}
