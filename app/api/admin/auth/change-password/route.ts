import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { fail, ok, parseBody, requireAdmin } from "@/lib/http";
import { audit } from "@/lib/admin/ops";
import { changePasswordInput } from "@/lib/validation/admin";

export async function POST(req: Request) {
  const g = await requireAdmin(req);
  if ("res" in g) return g.res;
  const parsed = await parseBody(req, changePasswordInput, 4000);
  if ("res" in parsed) return parsed.res;
  const user = await db.user.findUnique({ where: { id: g.session.uid } });
  if (!user || !(await verifyPassword(parsed.data.current, user.passwordHash))) return fail(422, "Current password is incorrect", { errors: { current: "Current password is incorrect" } });
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data.next) } });
  await audit(g.session, "change-password", "user", user.id);
  return ok();
}
