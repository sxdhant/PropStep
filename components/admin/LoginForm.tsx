"use client";

import { useState, type FormEvent } from "react";
import { Alert, api, Field } from "./ui";

export default function LoginForm() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const r = await api("/api/admin/auth/login", { method: "POST", body: { email: fd.get("email"), password: fd.get("password") } });
    if (r.ok) {
      window.location.href = "/admin/";
      return;
    }
    setError(r.data.error ?? "Could not sign in");
    setBusy(false);
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
      {error ? <Alert>{error}</Alert> : null}
      <Field label="Email" name="email">
        <input id="email" name="email" type="email" autoComplete="username" required autoFocus />
      </Field>
      <Field label="Password" name="password">
        <input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      <button className="a-btn primary" disabled={busy} style={{ justifyContent: "center" }}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
