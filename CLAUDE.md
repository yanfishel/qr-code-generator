# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

Next.js (App Router) + TypeScript, pnpm, Tailwind CSS + shadcn/ui, Prisma 6 (MySQL), Clerk (auth).

## Commands

- `pnpm dev` — start the dev server (Turbopack)
- `pnpm build` / `pnpm start` — production build / start
- `pnpm lint` — ESLint
- `pnpm test` — run the Vitest suite once; `pnpm test:watch` for watch mode
- `pnpm db:migrate` — run Prisma migrations (`prisma migrate dev`) — requires a real `DATABASE_URL`
- `pnpm db:studio` — Prisma Studio

## Database

`DATABASE_URL` in `.env` points at a real remote MySQL instance; migrations live in `prisma/migrations/` and have been applied. The DB user can't create databases, so `prisma migrate dev` needs a pre-provisioned `SHADOW_DATABASE_URL` (also in `.env`) — this is wired into `prisma/schema.prisma` via `shadowDatabaseUrl = env("SHADOW_DATABASE_URL")`. Without that, `db:migrate` fails with `P3014`.

## Auth

Auth is handled by Clerk (`@clerk/nextjs`). `ClerkProvider` wraps the app in `src/app/layout.tsx`, route matching lives in `src/proxy.ts`. `src/lib/current-user.ts#getCurrentUser` reads the signed-in user from `auth()` and lazily upserts the matching `User` row (keyed on `User.clerkId`) on first call — there is no seed script or default user anymore. `/saved` calls `auth.protect()` and redirects signed-out visitors to Clerk's sign-in page; the QR generator/download on `/` stays public, only `createQrCode` (via `getCurrentUser`) requires a session.

When a signed-out visitor clicks Save in `QrGeneratorForm`, it doesn't call `createQrCode` and surface the resulting `Unauthorized` error — it opens Clerk's sign-in modal (`useClerk().openSignIn()`) and retries the save automatically once `useAuth().isSignedIn` flips to true (also covering the race where the session expires between the client-side check and the server action call). The pending payload is stashed in `sessionStorage`, not a React ref/state: `.env`'s `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/` makes Clerk redirect after sign-in, which remounts the component and would wipe in-memory state before the retry could fire.

## Skills

Project-scoped Claude Code skills live in `.claude/skills/` (symlinked into `.agents/skills/`) and are tracked in `skills-lock.json`: `frontend-design` (from `anthropics/skills`) for UI/visual design work, and `clerk` / `clerk-cli` / `clerk-setup` (from `clerk/skills`, installed by `clerk init`) for Clerk-related tasks.

## Design

`src/app/globals.css` defines a custom token system, not the shadcn neutral defaults — a warm off-white/near-black palette with a single teal accent (`--primary`), wired for light and dark. Fonts are Space Grotesk (`font-display`, headings), Work Sans (`font-sans`, body), and IBM Plex Mono (`font-mono`, eyebrows/labels) via `next/font/google` in `src/app/layout.tsx` — not the default Geist. The signature motif is the "viewfinder" corner brackets (`src/components/qr/ViewfinderFrame.tsx`) around the live QR preview, echoing a camera's QR-scan detection UI. `src/components/qr/Logo.tsx` is a finder-pattern monogram. Keep new UI within this system rather than reintroducing shadcn's generic neutral/Geist look — this applies even when porting functionality from an external reference (e.g. a Figma Make export): borrow structure/behavior, not the reference's own visual skin.

## QR content model

`src/lib/qr-schema.ts` defines `qrTypes` (`URL`, `TEXT`, `EMAIL`, `WIFI`, `VCARD`, `SMS`, `PHONE`, `LOCATION`, `BITCOIN`, `WHATSAPP`, `EVENT`, `PAYPAL` — 12 types, shown 4-per-row in `QrTypeSelector`), a `QrFieldValues` shape covering every type's raw inputs, and `buildQrValue(type, fields)`, which encodes those raw inputs into the final string (e.g. `WIFI:T:...;;`, `mailto:...`, a vCard block, a `BEGIN:VCALENDAR` block for `EVENT`) that gets persisted as `QrCode.data`. `qrTypes` is mirrored by a Prisma `QrType` enum in `prisma/schema.prisma` — adding a type needs a migration there too.

In `QrGeneratorForm`, the per-type `fields` and selected `qrType` live in local `useState` — they are never sent to the server directly. Only the derived string from `buildQrValue` (plus the style fields below) is validated against `qrFormSchema` and persisted. Style inputs (name, colors, size, level, dotStyle, finderFrameStyle, finderMarkerStyle, margin, logo, logoSize) are the only fields wired through react-hook-form (`styleFormSchema`, `qrFormSchema.omit({ type: true, data: true })`). Don't try to fold the content fields into the RHF schema — they're intentionally decoupled since their shape changes per type and nothing about them is persisted verbatim. `styleDefaultValues` defaults `size` to 512px and `margin` to 1 cell.

The Style tab groups its fields into an `Accordion` (`src/components/ui/accordion.tsx`) inside `QrGeneratorForm`: five `AccordionItem`s — Color, Style, Size, Logo, Error correction — with Color open by default (`defaultValue="color"`). Two things in the shared UI primitives exist specifically to support this and matter if you add more accordions or wide field content elsewhere: `AccordionItem` carries `min-w-0` (it's a flex item of the `flex-col` `Accordion` root and won't shrink below its content without it), and `FormItem` (`src/components/ui/form.tsx`) uses `grid-cols-[minmax(0,1fr)]` instead of shadcn's stock plain `grid` (the standard grid-blowout fix). Both guard against the same failure: a field whose content is wider than the panel (e.g. `PresetLogoPicker`'s horizontally-scrolling logo row) blowing out past the panel edge and getting hard-clipped by the accordion's `overflow-hidden` instead of scrolling. `AccordionContent`'s inner wrapper only carries the padding utilities passed in per-item (`px-2 pt-3 pb-7` in `QrGeneratorForm`) — the shadcn defaults (link underline, paragraph margin, `h-(--radix-accordion-content-height)`) were stripped since nothing here uses them.

`bgColor`/`fgColor` accept 6- or 8-digit hex (`hexColor` regex in `qr-schema.ts`); the 8th byte is alpha, so `#FFFFFF00` is a fully transparent background. `ColorPickerField`'s `allowTransparent` prop (only passed for the background field) renders a toggle button that appends/strips the `00` suffix — it does not repaint the hole with the background color (that would be a no-op against a transparent fill), it relies on this alpha byte.

Type-specific inputs render via `QrContentFields`; the type grid via `QrTypeSelector`; the four-level error-correction picker via `ErrorCorrectionSelector`. When adding a new QR type: extend `qrTypes`/`QrFieldValues`/`buildQrValue`/`qrTypeLabels` in `qr-schema.ts`, add its icon to `QrTypeSelector`, and add its inputs to `QrContentFields`.

Wi-Fi SSID/password inputs use `autoComplete="off"` and a non-matching `name` (and the password field is `type="text"`, not `type="password"`) — without this, Chrome's saved network-credential autofill silently populates them with the user's real Wi-Fi credentials, which then get baked into a scannable QR code and would be persisted in plaintext on Save. Keep this in mind if you touch those two fields.

## QR rendering

QR codes are drawn by an in-house renderer, not `qrcode.react` (removed) — that library draws the whole code as one merged path, which can't do per-module shapes. `qrcode` (the `soldair/node-qrcode` package) is used only for `QRCode.create(value, { errorCorrectionLevel })`, which returns the raw module bit-matrix; everything downstream is custom.

- `src/lib/qr-render.ts#buildQrLayout` turns that bit-matrix into a `QrLayout`: `modules` (data modules only), `finderOrigins` (the three 7×7 position-detection patterns, always at the two top corners and bottom-left), and the logo excavation box — ported 1:1 from `qrcode.react`'s excavation math so logo-cutout behavior didn't change.
- `src/components/qr/QrCanvas.tsx` and `QrSvg.tsx` both consume that layout: `QrCanvas` draws to a `<canvas>` (PNG export, live preview), `QrSvg` builds `<svg>` markup (SVG export). Keep geometry constants (`DOT_*`, `FINDER_*`) in `qr-render.ts` so the two renderers stay visually identical — they can't share drawing code since one uses `CanvasRenderingContext2D` calls and the other builds JSX/path strings.
- `dotStyle` (`SQUARE` | `ROUNDED` | `DOTS` | `CLASSY`, `DotStyleSelector`) shapes data modules only.
- `finderFrameStyle` / `finderMarkerStyle` (`SQUARE` | `ROUNDED` | `CIRCLE`, `FinderStyleSelector`) shape the three finder patterns' outer ring and inner 3×3 block independently, via two `<button>` rows (`filled={false}` glyph for the frame, `filled={true}` for the marker). **Finder patterns always use these two fields, never `dotStyle`** — turning position-detection patterns into disconnected dots/diamonds would hurt scanner lock-on, so they're drawn as unified ring/marker shapes (evenodd fill for the ring, so it still shows through a transparent background) regardless of what `dotStyle` is set to.
- All four style fields are persisted (`QrDotStyle`/`QrFinderStyle` Prisma enums, defaulting to `SQUARE`) and read back by `SavedQrCard`, so history entries keep their original module shape.

Preset logos (`src/lib/logo-presets.ts`, picked via `PresetLogoPicker`) are inline `data:image/svg+xml` circles in the app's `--primary` teal with a white icon — not the multi-color icon set from the Figma-style reference this feature was built from; per the Design section above, only the row-of-circles *structure* was borrowed, not that reference's own color skin.

## Saved list

`/saved` paginates server-side: `listQrCodes(page, pageSize)` (`src/actions/qr-actions.ts`) runs a `count` plus a `findMany({ skip, take })` — only the current page's rows are ever fetched from the DB, never the full list. `src/app/saved/page.tsx` reads the page number from `?page=` (`searchParams`, a `Promise` per the App Router), and `listQrCodes` clamps an out-of-range page (e.g. the last item on the last page just got deleted) down to the last real page *before* querying, so a stale link still resolves to real rows instead of an empty page. Page size is the `PAGE_SIZE` const in `page.tsx` (currently 10). `<SavedQrList key={page} .../>` is keyed on the page number so navigating between pages force-remounts the list — without that, its internal optimistic-delete `useState(initialItems)` would keep showing the previous page's stale items, since React only reads that initial value on mount. Pagination links are real `next/link` navigations: `src/components/ui/pagination.tsx`'s `PaginationLink` was hand-edited to render `Link` instead of shadcn's stock `<a>` (the documented shadcn-for-Next.js customization), so clicking a page number doesn't full-reload.

`SavedQrCard` shows a colored `QrTypeBadge` (`src/components/qr/QrTypeBadge.tsx`) floating over the top-left corner of the preview. Its 12 colors come from `qrTypeAccentHue` in `qr-schema.ts` — a fixed hue rotation 30° apart per type, not hand-picked — tinted via `color-mix(in oklch, hsl(hue …) X%, var(--background|foreground))`, the same technique `globals.css` already uses for tints, so it adapts to light/dark without a second palette. The card's action bar is one right-aligned row: a single icon-only Download button (`DropdownMenu`) offering "Download PNG"/"Download SVG", then icon-only Share, Edit (green), and Delete (red) buttons, each with a `cursor-pointer` and a `Tooltip` naming the action — `TooltipProvider` wraps the app in `src/app/layout.tsx` since Radix's `Tooltip` throws without one. `vitest.setup.ts` stubs `ResizeObserver` (jsdom doesn't implement it, and Radix's Tooltip arrow needs it to size itself) and tests must render inside a `TooltipProvider` for the same reason.

Editing goes through `/saved/[id]/edit`, a protected route rendering `QrGeneratorForm` in `mode="edit"` with the fetched `QrCode` (via `getQrCode`, ownership-checked like `deleteQrCode`). Since only the final encoded `data` string is persisted — never the per-type content fields — pre-filling the edit form's Content tab needs `parseQrValue(type, data)` in `qr-schema.ts`, a best-effort inverse of `buildQrValue` covering all 12 types; a field that fails to parse is just left blank rather than throwing. Saving in edit mode calls `updateQrCode(id, payload)` instead of `createQrCode` and redirects to `/saved`; the sign-in-modal / pending-save-retry dance in `QrGeneratorForm` only applies to `mode="create"` since edit is already behind `auth.protect()`. Because `updateQrCode` always updates the row in place (never inserts), a saved code's share link stays valid across edits.

The card's Share button links to a permanent, public page at `/code/[id]` (no `auth.protect()` — reachable by anyone with the link), rendered by `src/app/code/[id]/page.tsx` plus the client component `src/components/qr/PublicQrView.tsx` (QR preview at the code's own persisted `size`, not the card's fixed 200px thumbnail, plus PNG/SVG download buttons — no type badge, no edit/delete). It's backed by `getPublicQrCode(id)` in `qr-actions.ts`, kept deliberately separate from the owner-scoped `getQrCode`: it skips `getCurrentUser()` (which throws when signed out) and queries with an explicit Prisma `select` (`publicQrCodeSelect`) instead of the full row. That `select` isn't optional — `PublicQrView` is a client component, so its props get serialized into the delivered HTML, and the full row includes `userId`; without the `select`, any anonymous visitor could read another user's internal id via view-source. Any new field `PublicQrView` or the page needs must be added to `publicQrCodeSelect` explicitly, or it silently won't be there.

## SEO

`src/app/layout.tsx`'s root `metadata` (`Metadata` from `next`) sets `metadataBase` (`https://qrframe.pro`), a title template (`"%s · QRFrame"` — child routes set only their own `title` string via their own exported `metadata`/`generateMetadata`, not the full `"X · QRFrame"`), the default OpenGraph/Twitter card, and `keywords`. `viewport` is exported separately (not nested in `metadata`, per current Next.js typing) with a light/dark `themeColor` pair. Public, indexable pages (`/`, `/code/[id]`) get real metadata; auth-only pages (`/saved`, `/saved/[id]/edit`, `/sign-in`, `/sign-up`) export a minimal `metadata` with just a `title` and `robots: { index: false, follow: false }` — they're reachable but intentionally deindexed rather than blocked outright, since they're already behind `auth.protect()` or Clerk's own UI. `/code/[id]/page.tsx` uses `generateMetadata` (not a static `metadata` export) because its title/description depend on the fetched QR code (`qrCode.name` or a `qrTypeLabels[qrCode.type]`-derived fallback) — it returns `{}` when the code doesn't exist, deferring to the page body's own `notFound()`.

The home page (`src/app/page.tsx`) injects a `WebApplication` JSON-LD block via a plain `<script type="application/ld+json">` with `dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}` — this is safe only because `jsonLd` is a static, hardcoded object with no user input; don't reuse this pattern for anything containing DB-sourced strings without escaping.

`icon.tsx`, `apple-icon.tsx`, and `opengraph-image.tsx` (Next's file-convention metadata routes, at `src/app/`) generate their PNGs at request time via `next/og`'s `ImageResponse` rather than shipping static image files — each is a small JSX tree of `<div>`s with inline `style`, not real markup/CSS. Because `ImageResponse` can't consume Tailwind classes or CSS custom properties, the teal/white/ink colors are hardcoded hex literals (`#0E9E92`, `#F7FDFC`, `#101412`, `#F7F8F5`) duplicating `globals.css`'s light-mode `--primary` / `--primary-foreground` / dark `--background` / light `--background` tokens — if the palette in `globals.css` changes, these three files need updating by hand, there's no shared source of truth. `manifest.ts` (PWA manifest) references `/icon` and `/apple-icon` as icon URLs, relying on Next serving those routes at those paths rather than pointing at static files.

`robots.ts` allows `/` and disallows `/saved`, `/sign-in`, `/sign-up` (mirrors the per-page `robots: noindex` above, belt-and-suspenders), and points to `sitemap.xml`. `sitemap.ts` currently lists only the home page — per-code public share pages (`/code/[id]`) are intentionally omitted since they're user-generated/unbounded, not app routes; don't add a blanket `/code/*` entry without a plan for enumerating live codes.

## Testing

Vitest + React Testing Library (`vitest.config.ts`, `vitest.setup.ts`, jsdom environment, `@/*` alias resolved via `resolve.tsconfigPaths`). Tests live in a `__tests__` directory next to the file under test, named `[filename].test.tsx` (e.g. `src/app/saved/__tests__/page.test.tsx`). Prefer mocking sibling components/actions to isolate the unit under test and assert on behavior (rendered output, calls to mocked actions) rather than implementation details.

jsdom's `canvas.getContext("2d")` returns `null` (no `canvas` npm package installed), so `QrCanvas` can't be exercised directly — its draw effect just bails out early in tests. QR-rendering coverage instead lives in `src/lib/__tests__/qr-render.test.ts` (pure `buildQrLayout` geometry: module count, excavation, finder origins) and `QrSvg.test.tsx` (renders real markup in jsdom since SVG elements need no canvas backend) — `QrCanvas` and `QrSvg` share the same layout/geometry, so the SVG output stands in for both.

## Conventions

- shadcn/ui components live in `src/components/ui/` (Radix UI base, "nova" preset); app-specific components live in `src/components/qr/`.
- Server actions (`src/actions/`) use `"use server"` and are the only way client components touch Prisma — do not call `prisma` directly from client components.
- `src/app/saved/page.tsx` is `force-dynamic` since it reads from the database and must not be attempted during static generation.
- `useQrDownload` (`src/hooks/use-qr-download.ts`) accepts either an `HTMLCanvasElement` (→ PNG) or an `SVGSVGElement` (→ SVG) and branches on `instanceof`; pass the right ref rather than adding a second hook.
