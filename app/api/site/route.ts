import { getSite } from "@/lib/data";
import { ok } from "@/lib/http";

export const revalidate = 300;

/** GET /api/site: public site settings, advisors, testimonials, services and FAQs */
export async function GET() {
  const { form_endpoint: _unused, ...site } = await getSite();
  return ok({ site });
}
