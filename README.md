# QR Code Generator

A QR code generator built with Next.js: configure content and style, download as PNG/SVG, and — for signed-in users — save a history of generated codes.

## Stack

- **Next.js (App Router) + TypeScript**
- **Tailwind CSS + shadcn/ui** (Radix UI, custom theme)
- **Prisma 6** (MySQL)
- **Clerk** — authentication
- **pnpm** — package manager
- **Vitest + React Testing Library** — tests

## Features

- Nine QR code types: URL, text, email, Wi-Fi, contact (vCard), SMS, phone, location, Bitcoin.
- Style customization: foreground/background colors, size, error-correction level, margin, centered logo.
- Download the generated code as PNG or SVG.
- History of saved QR codes at `/history` — available only to signed-in users (Clerk); the generator itself and downloading stay public.

## Getting started

```bash
pnpm install
pnpm dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Environment variables

`.env` must contain:

- `DATABASE_URL` — connection to the live MySQL database (migrations already applied).
- `SHADOW_DATABASE_URL` — a separate database for `prisma migrate dev` (the DB user can't create databases, so migrations fail with `P3014` without a shadow database).
- Clerk keys (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, etc.).

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the dev server (Turbopack) |
| `pnpm build` / `pnpm start` | Production build / start |
| `pnpm lint` | ESLint |
| `pnpm test` | Run the Vitest suite once |
| `pnpm test:watch` | Tests in watch mode |
| `pnpm db:migrate` | `prisma migrate dev` (requires `SHADOW_DATABASE_URL`) |
| `pnpm db:studio` | Prisma Studio |

## Project structure

```
src/
  actions/     — server actions ("use server"), the only entry point to Prisma from the client
  app/         — App Router pages (/, /history, /sign-in, /sign-up)
  components/
    qr/        — QR generator components (form, preview, type/error-correction selectors)
    ui/        — shadcn/ui components (Radix UI, "nova" preset)
  hooks/       — e.g. use-qr-download — PNG/SVG download
  lib/         — qr-schema.ts (QR content model), current-user.ts, prisma.ts
  proxy.ts     — Clerk route matching
prisma/
  schema.prisma, migrations/
```

## QR content model

`src/lib/qr-schema.ts` defines `qrTypes`, the `QrFieldValues` shape covering every type's raw inputs, and `buildQrValue(type, fields)`, which turns those inputs into the final string (`WIFI:T:...;;`, `mailto:...`, a vCard block, etc.) persisted as `QrCode.data`. Style fields (name, colors, size, error-correction level, margin, logo) are validated separately via `qrFormSchema`.

For more on architecture, the design system, and conventions, see [CLAUDE.md](./CLAUDE.md).
