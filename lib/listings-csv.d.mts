export const COLUMNS: string[];
export const CSV_PATH: string;
export function inrShort(n: number): string;
export function csvCell(v: string): string;
export function parseCsv(text: string): string[][];
export function buildListings(csvText: string, root?: string, refs?: { advisors: string[]; localities: { name: string; slug: string }[]; icons: string[] } | null): { listings: unknown[]; errors: string[]; warnings: string[] };
export function listingToCells(listing: unknown): string[];
