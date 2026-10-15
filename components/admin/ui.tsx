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

const MAX_WIDTH = 2000;
const KEEP_AS_IS = 1.5 * 1024 * 1024; // already small and not too wide: upload untouched
const MAX_UPLOAD = 4 * 1024 * 1024; // the host rejects larger request bodies

/**
 * Shrink a photo in the browser before it is uploaded: at most 2000 px wide, JPEG quality 85 (lower only if it is still
 * over 4 MB). Small photos are left alone, and any failure falls back to the original file.
 */
async function prepareImage(file: File, logo = false): Promise<File> {
  try {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    if (bitmap.width <= (logo ? 800 : MAX_WIDTH) && file.size <= (logo ? 600 * 1024 : KEEP_AS_IS)) {
      bitmap.close();
      return file;
    }
    // A logo keeps its transparency (PNG) and is scaled to at most 800 px wide
    if (logo) {
      const w = Math.min(bitmap.width, 800);
      const h = Math.round((bitmap.height * w) / bitmap.width);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")?.drawImage(bitmap, 0, 0, w, h);
      const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      bitmap.close();
      if (!png || (png.size >= file.size && file.size <= MAX_UPLOAD)) return file;
      return new File([png], file.name.replace(/\.[^.]+$/, "") + ".png", { type: "image/png" });
    }
    const encode = async (width: number, quality: number) => {
      const w = Math.min(bitmap.width, width);
      const h = Math.round((bitmap.height * w) / bitmap.width);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.fillStyle = "#fff"; // JPEG has no transparency
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(bitmap, 0, 0, w, h);
      return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    };
    let blob = await encode(MAX_WIDTH, 0.85);
    if (blob && blob.size > MAX_UPLOAD) blob = await encode(1600, 0.75);
    bitmap.close();
    // Never make a photo bigger than it was
    if (!blob || (blob.size >= file.size && file.size <= MAX_UPLOAD)) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

/** Upload an image to the bucket (after shrinking it, see above); returns its URL */
export async function uploadImage(original: File, opts?: { logo?: boolean }): Promise<{ url?: string; error?: string }> {
  const file = await prepareImage(original, opts?.logo);
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/admin/uploads", { method: "POST", body: fd });
  const data = await res.json().catch(() => ({}));
  return res.ok ? { url: data.url } : { error: data.error ?? "Upload failed" };
}
