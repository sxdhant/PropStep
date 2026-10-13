import { getLocalities } from "@/lib/data";
import { ok } from "@/lib/http";

export const revalidate = 300;

/** GET /api/localities */
export async function GET() {
  return ok({ items: await getLocalities() });
}
