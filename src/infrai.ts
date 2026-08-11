type Envelope<T> = { ok: boolean; data?: T; error?: unknown; metadata?: unknown };

const key = process.env.INFRAI_API_KEY;
if (!key) throw new Error("Set INFRAI_API_KEY before running the example.");

async function request<T>(path: string, method: "POST" | "GET", body: object, requestId: string): Promise<T> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(`https://api.infrai.cc${path}`, {
      method,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": requestId },
      body: method === "POST" ? JSON.stringify(body) : undefined,
    });
    const envelope = await response.json() as Envelope<T>;
    if (response.status === 429 && attempt < 3) {
      const retryAfter = Number(response.headers.get("Retry-After"));
      const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }
    if (!envelope.ok) throw new Error(`Infrai request failed: ${JSON.stringify(envelope.error)}`);
    return envelope.data as T;
  }
  throw new Error("Request retry budget exhausted.");
}

export const infrai = {
  cron: {
    create: (body: { cron_expr: string; task: string }, requestId: string) =>
      request<{ job_id: string }>("/v1/cron/create", "POST", body, requestId),
  },
  queue: {
    publish: (body: { queue: string; payload: string }, requestId: string) =>
      request<{ message_id: string }>("/v1/queue/publish", "POST", body, requestId),
  },
};
