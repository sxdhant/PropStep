"use client";

import { useState, type FormEvent } from "react";
import Select from "./Select";
import { Alert, api, Field, fmtDate, Pager, Pill, useLoad } from "./ui";

type User = { id: string; email: string; name: string | null; role: "ADMIN" | "EDITOR"; active: boolean; lastLoginAt: string | null };

export function Users() {
  const { data, loading, error, reload } = useLoad<{ items: User[] }>("/api/admin/users");
  const [msg, setMsg] = useState<{ error?: string; ok?: string }>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newRole, setNewRole] = useState("EDITOR");

  async function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const r = await api("/api/admin/users", { method: "POST", body: { email: fd.get("email"), name: fd.get("name"), role: newRole, password: fd.get("password") } });
    if (!r.ok) {
      setErrors(r.data.errors ?? {});
      return setMsg({ error: r.data.error });
    }
    setErrors({});
    setMsg({ ok: "User created. Share the password with them securely and ask them to change it." });
    form.reset();
    reload();
  }
  async function patch(u: User, body: object) {
    const r = await api(`/api/admin/users/${u.id}`, { method: "PATCH", body });
    if (!r.ok) setMsg({ error: r.data.error });
    else { setMsg({}); reload(); }
  }
  async function resetPw(u: User) {
    const pw = prompt(`New password for ${u.email} (min 12 characters)`);
    if (!pw) return;
    const r = await api(`/api/admin/users/${u.id}`, { method: "PATCH", body: { password: pw } });
    setMsg(r.ok ? { ok: "Password changed." } : { error: r.data.errors?.password ?? r.data.error });
  }
  async function remove(u: User) {
    if (!confirm(`Delete ${u.email}?`)) return;
    const r = await api(`/api/admin/users/${u.id}`, { method: "DELETE" });
    if (!r.ok) setMsg({ error: r.data.error });
    else reload();
  }

  return (
    <>
      <h1>Users</h1>
      <p className="admin-sub">Admins manage everything, including users and the activity log. Editors manage website content and leads. There is no public signup: accounts are created here.</p>
      {msg.error || error ? <Alert>{msg.error || error}</Alert> : null}
      {msg.ok ? <Alert kind="ok">{msg.ok}</Alert> : null}
      <form className="a-card" onSubmit={add} noValidate>
        <h2>Add a user</h2>
        <div className="a-grid">
          <Field label="Email" name="u-email" error={errors.email}><input id="u-email" name="email" type="email" required /></Field>
          <Field label="Name" name="u-name"><input id="u-name" name="name" /></Field>
          <Field label="Role" name="u-role"><Select label="Role" value={newRole} onChange={setNewRole} options={[["EDITOR", "Editor"], ["ADMIN", "Admin"]]} /></Field>
          <Field label="Temporary password" name="u-pw" error={errors.password} hint="At least 12 characters"><input id="u-pw" name="password" type="password" autoComplete="new-password" required /></Field>
        </div>
        <p style={{ marginTop: 14 }}><button className="a-btn primary">Create user</button></p>
      </form>
      <div className="a-table-wrap">
        <table className="a-table">
          <thead><tr><th>User</th><th>Role</th><th>Last sign-in</th><th>Status</th><th /></tr></thead>
          <tbody>
            {data?.items.map((u) => (
              <tr key={u.id}>
                <td>{u.name ? <b>{u.name}</b> : null} {u.name ? <br /> : null}{u.email}</td>
                <td>
                  <Select compact label="Role" value={u.role} onChange={(v) => patch(u, { role: v })} options={[["EDITOR", "Editor"], ["ADMIN", "Admin"]]} />
                </td>
                <td>{u.lastLoginAt ? fmtDate(u.lastLoginAt) : "Never"}</td>
                <td>{u.active ? <Pill tone="green">Active</Pill> : <Pill tone="red">Disabled</Pill>}</td>
                <td className="num">
                  <button className="a-btn sm" onClick={() => patch(u, { active: !u.active })}>{u.active ? "Disable" : "Enable"}</button>{" "}
                  <button className="a-btn sm" onClick={() => resetPw(u)}>Reset password</button>{" "}
                  <button className="a-btn sm danger" onClick={() => remove(u)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading ? <div className="a-empty">Loading…</div> : null}
      </div>
    </>
  );
}

type Entry = { id: string; action: string; entity: string; entityId: string | null; diff: unknown; createdAt: string; user: { email: string } | null };
export function Audit() {
  const [page, setPage] = useState(1);
  const { data, loading, error } = useLoad<{ items: Entry[]; page: number; pages: number }>(`/api/admin/audit?page=${page}`);
  return (
    <>
      <h1>Activity log</h1>
      <p className="admin-sub">Who changed what, most recent first.</p>
      {error ? <Alert>{error}</Alert> : null}
      <div className="a-table-wrap">
        <table className="a-table">
          <thead><tr><th>When</th><th>Who</th><th>What</th><th>Details</th></tr></thead>
          <tbody>
            {data?.items.map((a) => (
              <tr key={a.id}>
                <td>{fmtDate(a.createdAt)}</td>
                <td>{a.user?.email ?? "removed user"}</td>
                <td><Pill>{a.action}</Pill> {a.entity}</td>
                <td><small className="admin-sub">{a.diff ? JSON.stringify(a.diff) : a.entityId ?? ""}</small></td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading ? <div className="a-empty">Loading…</div> : null}
      </div>
      {data ? <Pager page={data.page} pages={data.pages} onPage={setPage} /> : null}
    </>
  );
}

export function Account() {
  const [msg, setMsg] = useState<{ error?: string; ok?: string }>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    if (fd.get("next") !== fd.get("again")) return setErrors({ again: "The two new passwords don't match" });
    const r = await api("/api/admin/auth/change-password", { method: "POST", body: { current: fd.get("current"), next: fd.get("next") } });
    if (!r.ok) {
      setErrors(r.data.errors ?? {});
      return setMsg({ error: r.data.error });
    }
    setErrors({});
    setMsg({ ok: "Password changed." });
    form.reset();
  }
  return (
    <>
      <h1>Change password</h1>
      <form className="a-card" onSubmit={submit} style={{ maxWidth: 420, display: "grid", gap: 14 }} noValidate>
        {msg.error ? <Alert>{msg.error}</Alert> : null}
        {msg.ok ? <Alert kind="ok">{msg.ok}</Alert> : null}
        <Field label="Current password" name="current" error={errors.current}><input id="current" name="current" type="password" autoComplete="current-password" required /></Field>
        <Field label="New password" name="next" error={errors.next} hint="At least 12 characters"><input id="next" name="next" type="password" autoComplete="new-password" required /></Field>
        <Field label="Repeat new password" name="again" error={errors.again}><input id="again" name="again" type="password" autoComplete="new-password" required /></Field>
        <div><button className="a-btn primary">Change password</button></div>
      </form>
    </>
  );
}
