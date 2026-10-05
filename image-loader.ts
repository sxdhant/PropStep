/**
 * next/image loader for Unsplash photo ids.
 * src format: "unsplash:<photo-id>:<w>x<h>[:<gravity>]"  e.g. "unsplash:1600585154340-be6161a56a0c:3x2"
 * The ratio lets the CDN crop, so every srcset candidate has the same shape as its container.
 * Optional gravity ("top", "bottom", "left", "right") keeps that edge when cropping.
 */
export default function unsplashLoader({ src, width }: { src: string; width: number; quality?: number }) {
  if (!src.startsWith("unsplash:")) return src;
  const [, id, ratio = "3x2", gravity] = src.split(":");
  const [rw, rh] = ratio.split("x").map(Number);
  const height = Math.round((width * rh) / rw);
  const crop = gravity ? `&crop=${gravity}` : "";
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop${crop}&w=${width}&h=${height}&q=70`;
}
