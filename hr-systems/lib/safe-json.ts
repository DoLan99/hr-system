export async function safeJson(r: Response): Promise<any> {
  const text = await r.text().catch(() => "");
  if (!text) return {};
  try { return JSON.parse(text); } catch { return {}; }
}
