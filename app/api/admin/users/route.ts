import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { ok, parseBody, requireAdmin } from "@/lib/http";
import { audit, dbError, plain } from "@/lib/admin/ops";
import { userCreate } from "@/lib/validation/admin";

const select = { id: true, email: true, name: true, role: true, active: true, lastLoginAt: true, createdAt: true } as const;

/** Admin only: list and create staff accounts (there is no public signup) */
export async function GET(req: Request) {
  const g = await requireAdmin(req, ["ADMIN"]);
  if ("res" in g) return g.res;
  return ok(plain({ items: await db.user.findMany({ orderBy: { createdAt: "asc" }, select }) }));
}

export async function POST(req: Request) {
  const g = await requireAdmin(req, ["ADMIN"]);
  if ("res" in g) return g.res;
  const parsed = await parseBody(req, userCreate, 4000);
  if ("res" in parsed) return parsed.res;
  const { password, ...rest } = parsed.data;
  try {
    const user = await db.user.create({ data: { ...rest, passwordHash: await hashPassword(password) }, select });
    await audit(g.session, "create", "user", user.id, { email: user.email, role: user.role });
    return ok(plain({ user }), { status: 201 });
  } catch (e) {
    return dbError(e, "A user with that email");
  }
}
