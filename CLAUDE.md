# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

Next.js (App Router) + TypeScript, pnpm, Tailwind CSS + shadcn/ui, Prisma 6 (MySQL).

## Commands

- `pnpm dev` — start the dev server (Turbopack)
- `pnpm build` / `pnpm start` — production build / start
- `pnpm lint` — ESLint
- `pnpm db:migrate` — run Prisma migrations (`prisma migrate dev`) — requires a real `DATABASE_URL`
- `pnpm db:seed` — seed the single default user (Prisma no longer auto-seeds on migrate)
- `pnpm db:studio` — Prisma Studio

## Database

`DATABASE_URL` in `.env` currently holds a placeholder (see `.env.example`) so `prisma generate` and builds work without a live connection. Real MySQL credentials need to be added before `db:migrate`/`db:seed` will succeed.

Auth is deferred: the app runs in single-user mode against one seeded default user (`prisma/seed.ts`, `src/lib/current-user.ts`). `User.clerkId` is ready for a future Clerk integration — see the `TODO(clerk)` markers in `src/lib/current-user.ts` and `prisma/schema.prisma` for the swap-in point.

## Conventions

- shadcn/ui components live in `src/components/ui/` (Radix UI base, "nova" preset); app-specific components live in `src/components/qr/`.
- Server actions (`src/actions/`) use `"use server"` and are the only way client components touch Prisma — do not call `prisma` directly from client components.
- `src/app/history/page.tsx` is `force-dynamic` since it reads from the database and must not be attempted during static generation.
