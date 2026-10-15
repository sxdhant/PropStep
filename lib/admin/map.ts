/**
 * Turns what an admin pastes for "Project location" (a Google Maps share link, a long maps URL, or the embed HTML)
 * into an address that can be shown in an iframe. Short links (maps.app.goo.gl) are followed to their real address.
 */
const ALLOWED = /^(www\.|maps\.)?google\.[a-z.]+$|^maps\.app\.goo\.gl$|^goo\.gl$/;

const embedFor = (q: string) => `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=16&output=embed`;

export async function resolveMap(input: string): Promise<{ url: string; embed: string } | { error: string }> {
  const bad = { error: "Could not read that link. In Google Maps open the project, press Share, then Copy link, and paste it here." };
  let raw = input.trim();
  const iframe = raw.match(/src=["']([^"']+)["']/i);
  if (iframe) raw = iframe[1];
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return bad;
  }
  if (url.protocol !== "https:" || !ALLOWED.test(url.hostname)) return { error: "Paste a Google Maps link (it starts with https://maps.app.goo.gl or https://www.google.com/maps)." };
  // An embed link already works in an iframe
  if (url.pathname.startsWith("/maps/embed")) return { url: url.toString(), embed: url.toString() };

  let final = url;
  if (/goo\.gl$/.test(url.hostname)) {
    try {
      const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(6000), headers: { "User-Agent": "Mozilla/5.0" } });
      final = new URL(res.url);
    } catch {
      return { error: "Could not open that short link. Try again, or paste the long address from the browser bar instead." };
    }
    if (!ALLOWED.test(final.hostname)) return bad;
  }
  const text = decodeURIComponent(final.toString());
  const at = text.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ?? text.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  const q = final.searchParams.get("q") ?? final.searchParams.get("query");
  const place = text.match(/\/maps\/place\/([^/@?]+)/)?.[1]?.replace(/\+/g, " ");
  const target = at ? `${at[1]},${at[2]}` : q || place;
  if (!target) return bad;
  return { url: url.toString(), embed: embedFor(target) };
}
