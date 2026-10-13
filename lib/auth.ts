import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { db } from "./db";

export type Role = "ADMIN" | "EDITOR";
export type Session = { uid: string; email: string; role: Role };

export const SESSION_COOKIE = "ps_admin";
const MAX_AGE = 60 * 60 * 8; // 8 hours

const secret = () => {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET must be set to at least 32 characters");
  return new TextEncoder().encode(s);
};

export const hashPassword = (pw: string) => bcrypt.hash(pw, 12);
export const verifyPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);

export async function createSession(s: Session) {
  const token = await new SignJWT({ ...s })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Verify a raw token (also used by the proxy, which cannot hit the database). */
export async function readToken(token?: string): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { uid: String(payload.uid), email: String(payload.email), role: payload.role as Role };
  } catch {
    return null;
  }
}

/** The signed-in admin, re-checked against the database so deactivated users lose access at once. */
export async function getSession(): Promise<Session | null> {
  const s = await readToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (!s) return null;
  const user = await db.user.findUnique({ where: { id: s.uid }, select: { active: true, role: true, email: true } });
  if (!user?.active) return null;
  return { uid: s.uid, email: user.email, role: user.role };
}
