import { getSession } from "@/lib/auth";
import { fail, ok } from "@/lib/http";

export async function GET() {
  const s = await getSession();
  return s ? ok({ user: { email: s.email, role: s.role } }) : fail(401, "Please sign in");
}
