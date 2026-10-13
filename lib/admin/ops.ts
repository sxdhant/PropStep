import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { fail } from "@/lib/http";
import type { Session } from "@/lib/auth";
import { TAGS } from "@/lib/data";

type Tag = keyof typeof TAGS;

/** Refresh the public pages that read this content (the site updates without a redeploy) */
export const bust = (...tags: Tag[]) => tags.forEach((t) => revalidateTag(TAGS[t], { expire: 0 }));

export const audit = (s: Session, action: string, entity: string, entityId?: string, diff?: unknown) =>
  db.auditLog
    .create({ data: { userId: s.uid, action, entity, entityId, diff: diff === undefined ? undefined : JSON.parse(JSON.stringify(diff)) } })
    .catch((e) => console.error("[audit] failed:", e));

/** Prisma errors -> friendly responses (duplicate slug, missing row, still referenced) */
export function dbError(e: unknown, what: string) {
  const code = (e as { code?: string })?.code;
  if (code === "P2002") return fail(409, `${what} already exists`, { errors: { _: `${what} already exists` } });
  if (code === "P2025") return fail(404, `${what} not found`);
  if (code === "P2003") return fail(409, `${what} is still in use`);
  console.error(`[admin] ${what}:`, e);
  return fail(500, "Something went wrong");
}

/** JSON-safe copy (BigInt -> number, Date -> ISO) */
export const plain = <T,>(v: T): T => JSON.parse(JSON.stringify(v, (_, x) => (typeof x === "bigint" ? Number(x) : x)));
