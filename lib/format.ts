/** Indian digit grouping: 1234567 → "12,34,567"; with `decimals`, 1234.5 → "1,234.5" (fixed places). */
export function inrGroup(n: number, decimals = 0): string {
  const [whole, frac] = n.toFixed(decimals).split(".");
  const s = whole;
  if (s.length <= 3) return frac ? `${s}.${frac}` : s;
  let head = s.slice(0, -3);
  const tail = s.slice(-3);
  const groups: string[] = [];
  while (head.length > 2) {
    groups.unshift(head.slice(-2));
    head = head.slice(0, -2);
  }
  if (head) groups.unshift(head);
  const out = `${groups.join(",")},${tail}`;
  return frac ? `${out}.${frac}` : out;
}

/** ₹1.20 Cr / ₹45.00 L / ₹68,000: prices in Cr and L always carry two decimals */
export function inrShort(n: number): string {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return `₹${inrGroup(n)}`;
}

/** Gives the Cr / L amounts inside a stored price label two decimals: "₹1.5 Cr" → "₹1.50 Cr"; other text is left alone. */
export const fmtPriceLabel = (s: string) => s.replace(/(\d+(?:\.\d+)?)(\s*(?:Cr|L)\b)/g, (_, num: string, unit: string) => `${Number(num).toFixed(2)}${unit}`);

/** An area figure (sq ft, acres …) always shows one decimal: 1850 → "1,850.0" */
export const area1 = (n: number) => inrGroup(n, 1);

/** The project's total area as typed ("4.5 acres", "4.56", "4") → "4.5 Acres"; a number alone means acres. Text that isn't a number is left as is. */
export function fmtTotalArea(s: string): string {
  const m = s.trim().match(/^([\d,]*\.?\d+)\s*(.*)$/);
  if (!m) return s;
  const unit = m[2].trim();
  return `${area1(Number(m[1].replace(/,/g, "")))} ${!unit || /^acres?$/i.test(unit) ? "Acres" : unit}`;
}

export const inr = (n: number) => `₹${inrGroup(n)}`;

export function initials(name: string): string {
  const parts = name.replace("&", " ").split(/\s+/).filter((p) => /^[A-Za-z]/.test(p));
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export const waLink = (number: string, text: string) => `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
