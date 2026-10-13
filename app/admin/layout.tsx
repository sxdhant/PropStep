import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getSession } from "@/lib/auth";
import { hasDb } from "@/lib/data";
import AdminNav from "@/components/admin/AdminNav";
import "./admin.css";

export const metadata: Metadata = { title: { absolute: "Propstep Admin" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  let session = null;
  if (hasDb() && process.env.AUTH_SECRET) {
    try {
      session = await getSession();
    } catch (e) {
      console.error("[admin] session check failed:", e);
    }
  }
  // Signed out (the login page): no sidebar
  if (!session) return <div className="admin-root admin-solo">{children}</div>;
  return (
    <div className="admin-root">
      <AdminNav email={session.email} role={session.role} />
      <div className="admin-main">{children}</div>
    </div>
  );
}
