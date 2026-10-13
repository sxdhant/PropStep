import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

// pg treats sslmode=require as verify-full (and warns); say so explicitly
const make = (url: string | undefined) =>
  new PrismaClient({ adapter: new PrismaPg({ connectionString: url?.replace("sslmode=require", "sslmode=verify-full"), max: 5 }) });
const g = globalThis as unknown as { prisma?: { url?: string; client: PrismaClient } };

/**
 * Single Prisma client, reused across dev hot reloads. It is rebuilt if DATABASE_URL changes
 * (e.g. the variable was added while the dev server was running). DATABASE_URL must be Neon's pooled URL.
 */
function client() {
  const url = process.env.DATABASE_URL;
  if (!g.prisma || g.prisma.url !== url) g.prisma = { url, client: make(url) };
  return g.prisma.client;
}

export const db = new Proxy({} as PrismaClient, {
  get: (_, prop) => {
    const c = client();
    const v = Reflect.get(c, prop);
    return typeof v === "function" ? v.bind(c) : v; // keep `this` on the real client for $transaction etc.
  },
});
