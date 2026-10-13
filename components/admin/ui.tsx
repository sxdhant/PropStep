"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

export type ApiResult<T = Record<string, unknown>> = { ok: boolean; status: number; data: T & { error?: string; errors?: Record<string, string>; problems?: string[]; warnings?: string[] } };

/** fetch wrapper for /api/admin/*: JSON in, JSON out, and a redirect to the login page when the session has ended */
export async function api<T = Record<string, unknown>>(path: string, init?: { method?: string; body?: unknown }): Promise<ApiResult<T>> {
  const res = await fetch(path, {
    method: init?.method ?? "GET",
    headers: init?.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  if (res.status === 401 && !path.includes("/auth/login")) {
    window.location.href = "/admin/login/";
  }
  const data = await res.json().catch(() => ({ error: "Unexpected response" }));
  return { ok: res.ok, status: res.status, data };
}

/** Load a GET endpoint once (and again on reload()) */
export function useLoad<T = Record<string, unknown>>(path: string | null) {
  const [state, setState] = useState<{ loading: boolean; error?: string; data?: ApiResult<T>["data"] }>({ loading: !!path });
  const load = useCallback(async () => {
    if (!path) return;
    setState((s) => ({ ...s, loading: true }));
    const r = await api<T>(path);
    setState(r.ok ? { loading: false, data: r.data } : { loading: false, error: r.data.error ?? "Could not load" });
  }, [path]);
  useEffect(() => {
    load();
  }, [load]);
  return { ...state, reload: load };
}

export function Alert({ kind = "error", children }: { kind?: "error" | "ok"; children: ReactNode }) {
  return (
    <div className={`a-alert${kind === "ok" ? " ok" : ""}`} role={kind === "error" ? "alert" : "status"}>
      {children}
    </div>
  );
}

export function Problems({ error, problems }: { error?: string; problems?: string[] }) {
  if (!error && !problems?.length) return null;
  return (
    <Alert>
      {error}
      {problems?.length ? (
        <ul>
          {problems.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      ) : null}
    </Alert>
  );
}

type FieldProps = { label: string; name?: string; error?: string; hint?: string; wide?: boolean; children: ReactNode };
export function Field({ label, name, error, hint, wide, children }: FieldProps) {
  return (
    <div className={`a-field${wide ? " wide" : ""}${error ? " has-error" : ""}`}>
      <label htmlFor={name}>{label}</label>
      {children}
      {hint && !error ? <span className="hint">{hint}</span> : null}
      {error ? <span className="err">{error}</span> : null}
    </div>
  );
}

export const Pill = ({ tone, children }: { tone?: "green" | "amber" | "red" | "blue"; children: ReactNode }) => <span className={`a-pill${tone ? ` ${tone}` : ""}`}>{children}</span>;

export { fmtDate } from "./format";

export function Pager({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null;
  return (
    <div className="admin-head" style={{ marginTop: 12 }}>
      <span className="admin-sub" style={{ margin: 0 }}>
        Page {page} of {pages}
      </span>
      <div>
        <button className="a-btn sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </button>
        <button className="a-btn sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}

/** Upload an image to the bucket; returns its URL */
export async function uploadImage(file: File): Promise<{ url?: string; error?: string }> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/admin/uploads", { method: "POST", body: fd });
  const data = await res.json().catch(() => ({}));
  return res.ok ? { url: data.url } : { error: data.error ?? "Upload failed" };
}
