import { createHash } from "node:crypto";
import type { z } from "zod";
import { fieldErrors } from "./validation/common";
import { getSession, type Role, type Session } from "./auth";

export const ok = (data: object = {}, init?: ResponseInit) => Response.json({ ok: true, ...data }, init);
export const fail = (status: number, error: string, extra: object = {}) => Response.json({ ok: false, error, ...extra }, { status });

const MAX_BODY = 200_000;

/** Read a JSON body (size-capped), then validate it. Returns the data or a ready 4xx response. */
export async function parseBody<S extends z.ZodType>(req: Request, schema: S, maxBytes = MAX_BODY): Promise<{ data: z.output<S> } | { res: Response }> {
  if (Number(req.headers.get("content-length") ?? 0) > maxBytes) return { res: fail(413, "Request too large") };
  let raw: unknown;
  try {
    const t = await req.text();
    if (t.length > maxBytes) return { res: fail(413, "Request too large") };
    raw = JSON.parse(t);
  } catch {
    return { res: fail(400, "Invalid request") };
  }
  const r = schema.safeParse(raw);
  if (!r.success) {
    const errors = fieldErrors(r.error);
    return { res: fail(422, Object.values(errors)[0] ?? "Invalid data", { errors }) };
  }
  return { data: r.data };
}

/** Reject cross-site writes: the Origin header, when sent, must match this host. */
export function sameOrigin(req: Request) {
  const o = req.headers.get("origin");
  if (!o) return true; // non-browser clients send none; browsers always do on POST
  try {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    return new URL(o).host === host;
  } catch {
    return false;
  }
}

export const clientIp = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
export const hashIp = (ip: string) => createHash("sha256").update(`${process.env.AUTH_SECRET ?? ""}:${ip}`).digest("hex").slice(0, 32);

/**
 * Fixed-window rate limit kept in memory. On serverless each instance counts separately, so this blunts
 * floods but isn't a hard cap: swap in Upstash/Redis for a global limit.
 */
const hits = new Map<string, { n: number; reset: number }>();
export function rateLimited(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || h.reset < now) {
    hits.set(key, { n: 1, reset: now + windowMs });
    if (hits.size > 5000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
    return false;
  }
  return ++h.n > limit;
}

/** Guard for admin handlers: signed in, right role, same-origin on writes. */
export async function requireAdmin(req: Request, roles: Role[] = ["ADMIN", "EDITOR"]): Promise<{ session: Session } | { res: Response }> {
  const session = await getSession();
  if (!session) return { res: fail(401, "Please sign in") };
  if (!roles.includes(session.role)) return { res: fail(403, "You don't have access to this") };
  if (req.method !== "GET" && !sameOrigin(req)) return { res: fail(403, "Blocked cross-site request") };
  return { session };
}
