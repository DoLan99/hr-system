// Google Drive video info utilities

const DRIVE_FILE_PATTERNS = [
  /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
  /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
  /drive\.google\.com\/uc\?(?:.*&)?id=([a-zA-Z0-9_-]+)/,
  /docs\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
];

export function parseDriveFileId(url: string): string | null {
  for (const pattern of DRIVE_FILE_PATTERNS) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

export type DriveVideoInfo = {
  fileId: string;
  title: string;
  durationMinutes: number;
};

export async function getDriveVideoInfo(fileId: string): Promise<DriveVideoInfo | null> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_API_KEY chưa được cấu hình");

  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=name,videoMediaMetadata&key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, { next: { revalidate: 0 } });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = body?.error?.message ?? `Drive API ${res.status}`;
    throw new Error(msg);
  }

  const data = await res.json();

  if (!data.videoMediaMetadata?.durationMillis) {
    throw new Error("File này không phải video hoặc không đọc được thời lượng. Hãy đảm bảo file đã được share 'Anyone with the link'.");
  }

  const durationMinutes = Math.max(1, Math.round(Number(data.videoMediaMetadata.durationMillis) / 60000));

  return {
    fileId,
    title: data.name ?? "",
    durationMinutes,
  };
}
