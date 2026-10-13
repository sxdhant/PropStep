/**
 * The site reads content/listings.csv directly (see lib/content.ts), so you only edit the sheet.
 *
 *   npm run listings:check    validate the sheet and list every problem with its row number
 *   npm run listings:export   one-off: content/listings.json -> content/listings.csv (overwrites the sheet!)
 *
 * Options: --csv <file>  --json <file>
 * Column and cell formats are documented at the top of lib/listings-csv.mjs.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildListings, COLUMNS, csvCell, listingToCells } from "../lib/listings-csv.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? path.resolve(process.argv[i + 1]) : fallback;
};
const CSV_FILE = arg("csv", path.join(ROOT, "content/listings.csv"));
const JSON_FILE = arg("json", path.join(ROOT, "content/listings.json"));

const cmd = process.argv[2];
if (cmd === "export") {
  const listings = JSON.parse(fs.readFileSync(JSON_FILE, "utf8"));
  const lines = [COLUMNS.join(","), ...listings.map((l) => listingToCells(l).map(csvCell).join(","))];
  fs.writeFileSync(CSV_FILE, "﻿" + lines.join("\r\n") + "\r\n"); // BOM so Excel reads UTF-8 (₹, accents)
  console.log(`Wrote ${listings.length} rows to ${path.relative(ROOT, CSV_FILE)}`);
} else if (cmd === "check") {
  const { listings, errors, warnings } = buildListings(fs.readFileSync(CSV_FILE, "utf8"), ROOT);
  warnings.forEach((w) => console.warn("warning:", w));
  errors.forEach((e) => console.error("error:", e));
  if (errors.length) (console.error(`\n${errors.length} problem(s) in ${path.relative(ROOT, CSV_FILE)}`), process.exit(1));
  console.log(`OK: ${listings.length} listings, ${warnings.length} warning(s)`);
} else (console.error("Usage: node scripts/listings.mjs check|export [--csv file] [--json file]"), process.exit(1));
