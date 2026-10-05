# Propstep — Next.js website

The Propstep website built with **Next.js 16 (App Router), React 19 and TypeScript**. Same design, content and motion as the
original static build in the parent folder, plus a real form backend.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000 with hot reload
```

Production build:

```bash
npm run build
npm start            # serves the optimised build
```

`npm run typecheck` runs TypeScript on its own.

> The project sits inside OneDrive. If installs are slow or files get locked, pause OneDrive syncing (or exclude `node_modules` and `.next`) while developing.

## How it's put together

| Folder | What's in it |
|---|---|
| `app/` | One folder per route. Home, `projects/[slug]`, `properties/[slug]`, `localities/[slug]`, services, about, contact, privacy, 404, plus `sitemap.ts`, `robots.ts`, `manifest.ts` and `api/enquiry/route.ts` |
| `components/` | UI. Server components by default; files marked `"use client"` hold the interactive parts |
| `content/*.json` | All business content — the same files as the static build. Edit these to change projects, listings, localities, contacts, team, FAQs |
| `lib/` | Typed content loader, formatting (₹ lakh/crore, Indian digit grouping), budgets, floor-plan drawings, image helpers |
| `app/globals.css` | The full design system (tokens at the top: `--blue-700` primary, `--orange-500` accent) |
| `image-loader.ts` | `next/image` loader for the Unsplash CDN (responsive srcset, AVIF/WebP, crop to ratio) |

**Rendering.** Every page is pre-rendered to static HTML at build time (`generateStaticParams` for the 6 projects, 13 listings
and 8 localities), so pages are fast and fully indexable. Only `/api/enquiry` runs on the server.

**Interactive components** (`"use client"`): header with mega-menu and mobile menu, hero search, developments filter, property
search (filters and sort, synced to the URL), tabs, rails, gallery + lightbox, EMI calculator, price-trend chart, sortable
table, testimonials, world clocks, sub-nav scrollspy, forms, and `MotionRoot` (scroll reveals, count-ups, hero entrance, page transitions).

**Page transitions.** Internal link clicks are wrapped in `document.startViewTransition()` (Chrome, Edge, Safari 18+); project
photos morph between the card and the project page. Other browsers navigate normally.

## Forms

All forms (site visits, enquiries, newsletter) post JSON to `/api/enquiry`, which validates the data, drops spam (honeypot field)
and forwards the lead to **`ENQUIRY_WEBHOOK_URL`**: a Zapier/Make webhook, your CRM's inbound endpoint (HubSpot, Zoho,
Salesforce, LeadSquared…), a Google Sheets integration or a Slack workflow.

Copy `.env.example` to `.env.local` and fill it in:

```
ENQUIRY_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/...
NEXT_PUBLIC_SITE_URL=https://www.propstep.in
```

If `ENQUIRY_WEBHOOK_URL` is not set, leads are printed to the server log and the visitor still sees the success message. That's fine
for development, but **set it before launch** or enquiries will be lost.

## Deploy

**Vercel (recommended):** import the repository, set the project root to `propstep-next`, add the two environment variables above, deploy.

**Any Node host** (Render, Railway, a VPS, AWS): run `npm run build` then `npm start` (Node 20+). Put it behind HTTPS.

**Plain static hosting (cPanel etc.):** possible with `output: "export"` in `next.config.ts`, but `/api/enquiry` won't exist — point
the forms at a third-party form service instead.

## Performance

- Pages are static HTML; content is readable before any JavaScript runs.
- CSS ≈ 17 KB compressed. JavaScript ≈ 155 KB compressed per page, of which about 115 KB is the React and Next.js runtime
  (shared and cached across pages) and about 30 KB is the site's own code. Client-side navigation after the first page is near-instant.
- Fonts are self-hosted by `next/font` (Manrope + Instrument Serif), so text doesn't shift when they load.
- Images: responsive `srcset`, lazy-loaded below the fold, fixed aspect ratios (no layout shift), portrait hero crop on phones.
- Motion uses only `transform`, `opacity` and `clip-path`; it is disabled under `prefers-reduced-motion`, and a lighter mode applies on Save-Data or low-memory devices.

## Before launch

Everything in `content/` is realistic **sample content**. Replace prices, RERA numbers, phone numbers, addresses, team names,
testimonials, stats and locality figures with real, approved data. Swap the placeholder photography for your own renders, add your
real logo (`components/primitives.tsx → LogoMark`, `app/icon.svg`, `public/logo-mark.svg`) and set the exact brand blue in
`app/globals.css`. The privacy page is placeholder text and needs review for the DPDP Act, 2023.

## Credits

Icons adapted from [Lucide](https://lucide.dev) (ISC). Fonts: Manrope and Instrument Serif (SIL OFL). Placeholder photos from [Unsplash](https://unsplash.com/license).
