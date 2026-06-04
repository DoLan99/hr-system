export async function safeFetchJson<T = any>(url: string, init?: RequestInit): Promise<{ ok: boolean; status: number; data?: T; error?: any } | null> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (e) {
    console.error(`[safeFetchJson] network error for ${url}:`, e);
    return null;
  }
  const text = await res.text();
  if (!text) {
    if (!res.ok) console.error(`[safeFetchJson] ${url} empty body status ${res.status}`);
    return { ok: res.ok, status: res.status };
  }
  try {
    const json = JSON.parse(text);
    return { ok: res.ok, status: res.status, ...json };
  } catch {
    console.error(`[safeFetchJson] ${url} non-JSON body:`, text.slice(0, 200));
    return { ok: res.ok, status: res.status };
  }
}
