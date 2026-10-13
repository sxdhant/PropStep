import LoginForm from "@/components/admin/LoginForm";
import { Logo } from "@/components/primitives";
import { hasDb } from "@/lib/data";

export default function LoginPage() {
  const ready = hasDb() && !!process.env.AUTH_SECRET;
  return (
    <div className="admin-login">
      <div className="admin-login__card">
        <Logo className="admin-login__logo" />
        <h1>
          Welcome <em>back</em>
        </h1>
        <p className="admin-sub">Sign in to manage listings, content and enquiries.</p>
        {ready ? <LoginForm /> : <div className="a-alert">The admin panel isn&apos;t set up yet: add DATABASE_URL and AUTH_SECRET to the environment, then run the database setup.</div>}
      </div>
    </div>
  );
}
