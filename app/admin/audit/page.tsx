import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Audit } from "@/components/admin/UsersAudit";

export default async function Page() {
  if ((await getSession())?.role !== "ADMIN") redirect("/admin/");
  return <Audit />;
}
