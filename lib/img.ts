/** Helpers for Unsplash-hosted placeholder photography. */

export type Ratio = [number, number];

/** src value understood by image-loader.ts; optional gravity keeps an edge when cropping ("top", …). */
export const photoSrc = (id: string, ratio: Ratio = [3, 2], gravity?: "top" | "bottom" | "left" | "right") =>
  isOwnPhoto(id) ? id : `unsplash:${id}:${ratio[0]}x${ratio[1]}${gravity ? `:${gravity}` : ""}`;

/** Photos that are not Unsplash ids: a /public path (e.g. "/properties/<slug>/01.jpg") or a full URL. They are served as-is. */
export const isOwnPhoto = (id: string) => /^(\/|https?:)/.test(id);

/** Direct CDN URL — for lightbox full-size images, Open Graph images and CSS-sized thumbnails. */
export function photoUrl(id: string, width = 1080, ratio: Ratio = [3, 2], q = 70) {
  if (isOwnPhoto(id)) return id;
  const h = Math.round((width * ratio[1]) / ratio[0]);
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&h=${h}&q=${q}`;
}
