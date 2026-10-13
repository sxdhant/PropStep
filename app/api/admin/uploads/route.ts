import { randomBytes } from "node:crypto";
import { fail, ok, requireAdmin } from "@/lib/http";
import { audit } from "@/lib/admin/ops";
import { putObject, sniffImage, storageConfigured } from "@/lib/storage";

const MAX_BYTES = 8 * 1024 * 1024;

/** POST /api/admin/uploads (multipart, field "file"): JPEG, PNG or WebP up to 8 MB. Returns the URL to store on a listing. */
export async function POST(req: Request) {
  const g = await requireAdmin(req);
  if ("res" in g) return g.res;
  if (!storageConfigured()) return fail(503, "Image storage isn't configured yet (see .env.example)");
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BYTES + 4096) return fail(413, "Image is larger than 8 MB");

  let file: FormDataEntryValue | null;
  try {
    file = (await req.formData()).get("file");
  } catch {
    return fail(400, "Send the image as multipart form data");
  }
  if (!(file instanceof File)) return fail(422, "No file received");
  if (file.size === 0 || file.size > MAX_BYTES) return fail(413, "Image must be between 1 byte and 8 MB");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffImage(bytes);
  if (!kind) return fail(422, "Only JPEG, PNG or WebP images are allowed");

  const now = new Date();
  const key = `uploads/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${randomBytes(12).toString("hex")}.${kind.ext}`;
  try {
    const url = await putObject(key, bytes, kind.type);
    await audit(g.session, "upload", "media", key);
    return ok({ url, key }, { status: 201 });
  } catch (e) {
    console.error("[uploads] failed:", e);
    return fail(502, "Could not store the image");
  }
}
