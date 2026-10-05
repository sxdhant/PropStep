/** Helpers for Unsplash-hosted placeholder photography. */

export type Ratio = [number, number];

/** src value understood by image-loader.ts; optional gravity keeps an edge when cropping ("top", …). */
export const photoSrc = (id: string, ratio: Ratio = [3, 2], gravity?: "top" | "bottom" | "left" | "right") =>
  `unsplash:${id}:${ratio[0]}x${ratio[1]}${gravity ? `:${gravity}` : ""}`;

/** Direct CDN URL — for lightbox full-size images, Open Graph images and CSS-sized thumbnails. */
export function photoUrl(id: string, width = 1080, ratio: Ratio = [3, 2], q = 70) {
  const h = Math.round((width * ratio[1]) / ratio[0]);
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&h=${h}&q=${q}`;
}
