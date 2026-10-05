/** Indian digit grouping: 1234567 → "12,34,567". */
export function inrGroup(n: number): string {
  const s = String(Math.round(n));
  if (s.length <= 3) return s;
  let head = s.slice(0, -3);
  const tail = s.slice(-3);
  const groups: string[] = [];
  while (head.length > 2) {
    groups.unshift(head.slice(-2));
    head = head.slice(0, -2);
  }
  if (head) groups.unshift(head);
  return `${groups.join(",")},${tail}`;
}

const trim = (v: number, d: number) => String(parseFloat(v.toFixed(d)));

/** ₹1.2 Cr / ₹45 L / ₹68,000 */
export function inrShort(n: number): string {
  if (n >= 1e7) return `₹${trim(n / 1e7, 2)} Cr`;
  if (n >= 1e5) return `₹${trim(n / 1e5, 2)} L`;
  return `₹${inrGroup(n)}`;
}

export const inr = (n: number) => `₹${inrGroup(n)}`;

export function initials(name: string): string {
  const parts = name.replace("&", " ").split(/\s+/).filter((p) => /^[A-Za-z]/.test(p));
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export const waLink = (number: string, text: string) => `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
