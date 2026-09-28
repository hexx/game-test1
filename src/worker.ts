/**
 * Cloudflare Workers エントリポイント。
 * 静的アセット（dist/）を配信しつつ、任意でエンディングの集計 API を提供する。
 *
 * ENDINGS という KV binding が無い場合、/api/endings は 501 を返し、
 * クライアント側は「みんなの記録」を静かに無効化する（ゲーム本体は動く）。
 */

interface Fetcher {
  fetch(input: Request): Promise<Response>;
}

interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

export interface Env {
  ASSETS: Fetcher;
  ENDINGS?: KVNamespace;
}

const ENDING_IDS = ['dawn', 'dream', 'quiet'] as const;
type EndingId = (typeof ENDING_IDS)[number];

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function isEndingId(value: unknown): value is EndingId {
  return typeof value === 'string' && (ENDING_IDS as readonly string[]).includes(value);
}

async function readCounts(kv: KVNamespace): Promise<Record<string, number>> {
  const entries = await Promise.all(
    ENDING_IDS.map(async (id) => [id, Number((await kv.get(`ending:${id}`)) ?? 0)] as const),
  );
  return Object.fromEntries(entries);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      return json({ ok: true, endings: Boolean(env.ENDINGS) });
    }

    if (url.pathname === '/api/endings') {
      if (!env.ENDINGS) {
        return json({ error: 'endings KV is not configured' }, 501);
      }
      const kv = env.ENDINGS;

      if (request.method === 'GET') {
        return json({ counts: await readCounts(kv) });
      }

      if (request.method === 'POST') {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: 'invalid JSON body' }, 400);
        }
        const ending = (body as { ending?: unknown } | null)?.ending;
        if (!isEndingId(ending)) {
          return json({ error: 'unknown ending' }, 400);
        }
        const key = `ending:${ending}`;
        const current = Number((await kv.get(key)) ?? 0);
        await kv.put(key, String(current + 1));
        return json({ counts: await readCounts(kv) });
      }

      return json({ error: 'method not allowed' }, 405);
    }

    return env.ASSETS.fetch(request);
  },
};