import { db } from "@/lib/db";
import { createSession, hashPassword, verifyPassword } from "@/lib/auth";
import { clientIp, fail, ok, parseBody, rateLimited, sameOrigin } from "@/lib/http";
import { loginInput } from "@/lib/validation/admin";

// A real bcrypt hash to compare against when the email is unknown, so timing doesn't reveal which emails exist
const DUMMY = hashPassword("not-a-real-password");

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail(403, "Blocked cross-site request");
  if (rateLimited(`login:ip:${clientIp(req)}`, 20, 15 * 60_000)) return fail(429, "Too many attempts. Try again in 15 minutes.");
  const parsed = await parseBody(req, loginInput, 4000);
  if ("res" in parsed) return fail(401, "Incorrect email or password");
  const { email, password } = parsed.data;
  if (rateLimited(`login:email:${email}`, 8, 15 * 60_000)) return fail(429, "Too many attempts. Try again in 15 minutes.");

  try {
    const user = await db.user.findUnique({ where: { email } });
    const valid = await verifyPassword(password, user?.passwordHash ?? (await DUMMY));
    if (!user || !user.active || !valid) return fail(401, "Incorrect email or password");

    await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await createSession({ uid: user.id, email: user.email, role: user.role });
    return ok({ user: { email: user.email, name: user.name, role: user.role } });
  } catch (e) {
    console.error("[login] failed:", e instanceof Error ? e.stack : String(e));
    return fail(500, "Sign-in is unavailable right now", process.env.NODE_ENV !== "production" ? { debug: e instanceof Error ? e.message.slice(0, 500) : String(e) } : {});
  }
}
