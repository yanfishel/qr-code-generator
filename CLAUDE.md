# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

Next.js (App Router) + TypeScript, pnpm, Tailwind CSS + shadcn/ui, Prisma 6 (MySQL), Clerk (auth).

## Commands

- `pnpm dev` — start the dev server (Turbopack)
- `pnpm build` / `pnpm start` — production build / start
- `pnpm lint` — ESLint
- `pnpm db:migrate` — run Prisma migrations (`prisma migrate dev`) — requires a real `DATABASE_URL`
- `pnpm db:studio` — Prisma Studio

## Database

`DATABASE_URL` in `.env` currently holds a placeholder (see `.env.example`) so `prisma generate` and builds work without a live connection. Real MySQL credentials need to be added before `db:migrate` will succeed.

## Auth

Auth is handled by Clerk (`@clerk/nextjs`). `ClerkProvider` wraps the app in `src/app/layout.tsx`, route matching lives in `src/proxy.ts`. `src/lib/current-user.ts#getCurrentUser` reads the signed-in user from `auth()` and lazily upserts the matching `User` row (keyed on `User.clerkId`) on first call — there is no seed script or default user anymore. `/history` calls `auth.protect()` and redirects signed-out visitors to Clerk's sign-in page; the QR generator/download on `/` stays public, only `createQrCode` (via `getCurrentUser`) requires a session.

## Skills

Project-scoped Claude Code skills live in `.claude/skills/` and are tracked in `skills-lock.json`. Currently installed: `frontend-design` (from `anthropics/skills`) — use it for UI/visual design guidance when building or reshaping frontend components.

## Conventions

- shadcn/ui components live in `src/components/ui/` (Radix UI base, "nova" preset); app-specific components live in `src/components/qr/`.
- Server actions (`src/actions/`) use `"use server"` and are the only way client components touch Prisma — do not call `prisma` directly from client components.
- `src/app/history/page.tsx` is `force-dynamic` since it reads from the database and must not be attempted during static generation.
