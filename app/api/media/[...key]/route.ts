import { getObject, storageConfigured } from "@/lib/storage";

/** GET /api/media/uploads/…: streams an uploaded image when the bucket is private (no STORAGE_PUBLIC_URL). */
export async function GET(_: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const key = (await params).key.join("/");
  // Only files the admin panel uploaded are served, and never path tricks
  if (!storageConfigured() || !/^uploads\/\d{4}\/\d{2}\/[a-f0-9]{24}\.(jpg|png|webp)$/.test(key)) return new Response("Not found", { status: 404 });
  try {
    const o = await getObject(key);
    return new Response(o.body, {
      headers: { "Content-Type": o.contentType, "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable", "X-Content-Type-Options": "nosniff", ...(o.length ? { "Content-Length": String(o.length) } : {}) },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
