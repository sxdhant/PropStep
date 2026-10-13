import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { fail, ok, parseBody, requireAdmin } from "@/lib/http";
import { audit, dbError, plain } from "@/lib/admin/ops";
import { userUpdate } from "@/lib/validation/admin";

type Ctx = { params: Promise<{ id: string }> };
const select = { id: true, email: true, name: true, role: true, active: true, lastLoginAt: true, createdAt: true } as const;

export async function PATCH(req: Request, { params }: Ctx) {
  const g = await requireAdmin(req, ["ADMIN"]);
  if ("res" in g) return g.res;
  const { id } = await params;
  const parsed = await parseBody(req, userUpdate, 4000);
  if ("res" in parsed) return parsed.res;
  const { password, ...rest } = parsed.data;
  // Nobody can lock themselves out by demoting or deactivating their own account
  if (id === g.session.uid && (rest.active === false || (rest.role && rest.role !== "ADMIN"))) return fail(422, "You can't demote or deactivate your own account");
  try {
    const user = await db.user.update({ where: { id }, data: { ...rest, ...(password ? { passwordHash: await hashPassword(password) } : {}) }, select });
    await audit(g.session, "update", "user", id, { ...rest, passwordChanged: !!password });
    return ok(plain({ user }));
  } catch (e) {
    return dbError(e, "User");
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  const g = await requireAdmin(req, ["ADMIN"]);
  if ("res" in g) return g.res;
  const { id } = await params;
  if (id === g.session.uid) return fail(422, "You can't delete your own account");
  try {
    await db.$transaction([db.auditLog.updateMany({ where: { userId: id }, data: { userId: null } }), db.user.delete({ where: { id } })]);
    await audit(g.session, "delete", "user", id);
    return ok();
  } catch (e) {
    return dbError(e, "User");
  }
}
