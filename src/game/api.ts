import type { EndingId } from './types';

/** エンディング到達を共有の記録に送る（KV 未設定の環境では無効）。 */
export async function recordEnding(id: EndingId): Promise<Record<string, number> | null> {
  try {
    const res = await fetch('/api/endings', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ending: id }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { counts?: Record<string, number> };
    return data.counts ?? null;
  } catch {
    return null;
  }
}

export async function fetchEndings(): Promise<Record<string, number> | null> {
  try {
    const res = await fetch('/api/endings');
    if (!res.ok) return null;
    const data = (await res.json()) as { counts?: Record<string, number> };
    return data.counts ?? null;
  } catch {
    return null;
  }
}