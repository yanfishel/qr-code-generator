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

Auth is handled by Clerk (`@clerk/nextjs`). `ClerkProvider` wraps the app in `src/app/layout.tsx`, route matching lives in `src/proxy.ts`. `src/lib/current-user.ts#getCurrentUser` reads the signed-in user from `auth()` and lazily upserts the matching `User` row (keyed on `User.clerkId`) on first call — there is no seed script or default user anymore. `/history` calls `auth.protect()` and redirects signed-out visitors to Clerk's sign-in page; the QR generator/download on `/` stays public, only `createQrCode` (via `getCurrentUser`) requires a session.

## Skills

Project-scoped Claude Code skills live in `.claude/skills/` (symlinked into `.agents/skills/`) and are tracked in `skills-lock.json`: `frontend-design` (from `anthropics/skills`) for UI/visual design work, and `clerk` / `clerk-cli` / `clerk-setup` (from `clerk/skills`, installed by `clerk init`) for Clerk-related tasks.

## Design

`src/app/globals.css` defines a custom token system, not the shadcn neutral defaults — a warm off-white/near-black palette with a single teal accent (`--primary`), wired for light and dark. Fonts are Space Grotesk (`font-display`, headings), Work Sans (`font-sans`, body), and IBM Plex Mono (`font-mono`, eyebrows/labels) via `next/font/google` in `src/app/layout.tsx` — not the default Geist. The signature motif is the "viewfinder" corner brackets (`src/components/qr/ViewfinderFrame.tsx`) around the live QR preview, echoing a camera's QR-scan detection UI. `src/components/qr/Logo.tsx` is a finder-pattern monogram. Keep new UI within this system rather than reintroducing shadcn's generic neutral/Geist look.

## Testing

Vitest + React Testing Library (`vitest.config.ts`, `vitest.setup.ts`, jsdom environment, `@/*` alias resolved via `resolve.tsconfigPaths`). Tests live in a `__tests__` directory next to the file under test, named `[filename].test.tsx` (e.g. `src/app/history/__tests__/page.test.tsx`). Prefer mocking sibling components/actions to isolate the unit under test and assert on behavior (rendered output, calls to mocked actions) rather than implementation details.

## Conventions

- shadcn/ui components live in `src/components/ui/` (Radix UI base, "nova" preset); app-specific components live in `src/components/qr/`.
- Server actions (`src/actions/`) use `"use server"` and are the only way client components touch Prisma — do not call `prisma` directly from client components.
- `src/app/history/page.tsx` is `force-dynamic` since it reads from the database and must not be attempted during static generation.
