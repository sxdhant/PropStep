import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

/**
 * Neon Object Storage (S3-compatible, path-style only). Env, from `neon env pull` / the Neon console:
 *   AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_ENDPOINT_URL_S3, AWS_REGION   credentials + branch endpoint
 *   STORAGE_BUCKET                                                             bucket name
 *   STORAGE_PUBLIC_URL   optional: https://<branch-id>.storage.c-<N>.<region>.aws.neon.tech/<bucket> for a public_read bucket.
 *                        Without it (private bucket) images are streamed through /api/media/<key>.
 */
export const storageConfigured = () => !!(process.env.AWS_ENDPOINT_URL_S3 && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.STORAGE_BUCKET);

let client: S3Client | undefined;
const s3 = () =>
  (client ??= new S3Client({
    region: process.env.AWS_REGION || "us-east-2",
    endpoint: process.env.AWS_ENDPOINT_URL_S3,
    forcePathStyle: true,
    credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID!, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY! },
  }));

export const mediaUrl = (key: string) => (process.env.STORAGE_PUBLIC_URL ? `${process.env.STORAGE_PUBLIC_URL.replace(/\/$/, "")}/${key}` : `/api/media/${key}`);

export async function putObject(key: string, body: Uint8Array, contentType: string) {
  await s3().send(
    new PutObjectCommand({ Bucket: process.env.STORAGE_BUCKET, Key: key, Body: body, ContentType: contentType, CacheControl: "public, max-age=31536000, immutable" }),
  );
  return mediaUrl(key);
}

export async function getObject(key: string) {
  const r = await s3().send(new GetObjectCommand({ Bucket: process.env.STORAGE_BUCKET, Key: key }));
  return { body: r.Body!.transformToWebStream(), contentType: r.ContentType ?? "application/octet-stream", length: r.ContentLength };
}

/** Identify an image by its first bytes: the browser-supplied type and file name can't be trusted */
export function sniffImage(b: Uint8Array): { type: string; ext: string } | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { type: "image/jpeg", ext: "jpg" };
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { type: "image/png", ext: "png" };
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return { type: "image/webp", ext: "webp" };
  return null;
}
