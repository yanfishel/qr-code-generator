# QR Code Generator

A QR code generator built with Next.js. Pick a content type, style the code, download it as PNG or SVG, and — once signed in — save the codes you've generated.

## Features

- **12 content types** — URL, text, email, Wi-Fi, contact (vCard), SMS, phone, location, Bitcoin, WhatsApp, calendar event, PayPal.
- **Style customization** — foreground/background colors, size, error-correction level, margin, and a centered logo overlay.
- **PNG/SVG export** — download the generated code in either format.
- **Saved codes** — signed-in users can save codes and revisit them at `/saved`; the generator and downloads themselves stay public.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | [Next.js](https://nextjs.org/) (App Router) + TypeScript |
| UI | Tailwind CSS + [shadcn/ui](https://ui.shadcn.com/) (Radix UI) |
| Database | [Prisma 6](https://www.prisma.io/) (MySQL) |
| Auth | [Clerk](https://clerk.com/) |
| Package manager | pnpm |
| Testing | Vitest + React Testing Library |

## Getting started

### Prerequisites

- Node.js 20+
- pnpm
- A MySQL database reachable from your machine (plus a second, empty database used only as Prisma's [shadow database](https://www.prisma.io/docs/orm/prisma-migrate/understanding-prisma-migrate/shadow-database))
- A [Clerk](https://clerk.com/) application (for sign-in)

### Setup

```bash
pnpm install
```

Create a `.env` file with:

```bash
DATABASE_URL="mysql://..."          # main database, migrations already applied
SHADOW_DATABASE_URL="mysql://..."   # empty database, used only by `prisma migrate dev`
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="..."
CLERK_SECRET_KEY="..."
```

> [!IMPORTANT]
> The database user for `DATABASE_URL` can't create databases itself, so `prisma migrate dev` needs `SHADOW_DATABASE_URL` to diff migrations against. Without it, `pnpm db:migrate` fails with error `P3014`.

Run the app:

```bash
pnpm dev
```

The app is now available at [http://localhost:3000](http://localhost:3000).

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the dev server (Turbopack) |
| `pnpm build` / `pnpm start` | Production build / start |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run the Vitest suite once |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm db:migrate` | Run Prisma migrations (`prisma migrate dev`) |
| `pnpm db:studio` | Open Prisma Studio |

## Project structure

```
src/
  actions/       Server actions ("use server") — the only entry point to Prisma from client components
  app/           App Router pages: / (generator), /saved, /sign-in, /sign-up
  components/
    qr/          QR generator UI: form, preview, type selector, error-correction selector
    ui/          shadcn/ui components (Radix UI, "nova" preset)
  hooks/         use-qr-download — PNG/SVG download logic
  lib/           qr-schema.ts (content model), current-user.ts, prisma.ts
  proxy.ts       Clerk route matching
prisma/
  schema.prisma, migrations/
```

## QR content model

`src/lib/qr-schema.ts` is the source of truth for what a QR code can encode:

- `qrTypes` — the list of supported content types, mirrored by a `QrType` enum in `prisma/schema.prisma`.
- `QrFieldValues` — the raw per-type input shape (e.g. SSID/password for Wi-Fi, address for a vCard).
- `buildQrValue(type, fields)` — encodes those inputs into the final string that gets persisted as `QrCode.data` (e.g. `WIFI:T:...;;`, `mailto:...`, a vCard or `BEGIN:VCALENDAR` block).

Content fields (per type) and style fields (name, colors, size, error-correction level, margin, logo) are validated separately: only the derived string plus style fields go through `qrFormSchema` before being persisted.

> [!NOTE]
> For a deeper dive into architecture, the design system, and repository conventions, see [CLAUDE.md](./CLAUDE.md).
