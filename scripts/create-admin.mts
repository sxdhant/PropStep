/**
 * Create or reset an admin-panel user (there is no signup page).
 *   npx tsx scripts/create-admin.ts --email you@propstep.in --password "<12+ chars>" [--role ADMIN|EDITOR] [--name "Name"]
 */
import "dotenv/config";
import { db } from "../lib/db";
import { hashPassword } from "../lib/auth";

const arg = (n: string) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};
const email = arg("email")?.trim().toLowerCase();
const password = arg("password");
const role = (arg("role") ?? "ADMIN").toUpperCase();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new Error("--email is required and must be valid");
if (!password || password.length < 12) throw new Error("--password is required (min 12 characters)");
if (role !== "ADMIN" && role !== "EDITOR") throw new Error("--role must be ADMIN or EDITOR");

const passwordHash = await hashPassword(password);
const user = await db.user.upsert({
  where: { email },
  create: { email, passwordHash, role, name: arg("name") },
  update: { passwordHash, role, active: true },
});
console.log(`${role} ready: ${user.email}`);
await db.$disconnect();
