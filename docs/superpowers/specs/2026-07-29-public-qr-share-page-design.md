# Public QR share page

## Problem

Saved QR codes can only be viewed inside the authenticated `/saved` list. There's no way to send someone a link that shows just the code itself, so they can view or download it without an account.

## Goal

Add a "Share" button to `SavedQrCard` that links to a permanent, public page showing only that QR code and download buttons. Editing a saved code must keep updating the same record the share link points to (already true today — `updateQrCode` updates by `id`, it never creates a new row).

## Data access

Add `getPublicQrCode(id: string)` to `src/actions/qr-actions.ts`:

```ts
export async function getPublicQrCode(id: string) {
  return prisma.qrCode.findUnique({ where: { id } });
}
```

This is deliberately separate from `getQrCode` (owner-scoped via `findFirst({ id, userId })`, used only by `/saved/[id]/edit`) and does not call `getCurrentUser()` — a signed-out visitor must be able to load the share page, and `getCurrentUser()` throws when there's no session. Mixing these two up would either break public access or introduce an ownership bypass on the edit path — keep them as two distinct functions.

## Route: `/code/[id]`

New `src/app/code/[id]/page.tsx`:

- Server component, `force-dynamic` (reads the DB, same reasoning as `/saved/page.tsx`).
- No `auth.protect()` — public route.
- Calls `getPublicQrCode(id)`; `notFound()` if the result is `null`.
- Renders:
  - A small eyebrow label + `<h1>` using `qrCode.name`, falling back to `qrTypeLabels[qrCode.type]` when the code has no name (there must always be some heading).
  - The QR code itself, styled like the live preview in `QrGeneratorForm`: `ViewfinderFrame` wrapping a `Card` containing `QrCanvas` + hidden `QrSvg`, rendered at the code's own persisted `size` (not the fixed 200px used by `SavedQrCard`'s thumbnail) since this is the page's main content.
  - Two outline download buttons, "PNG" and "SVG" (matching the generator form's button style), wired to `useQrDownload` against the canvas/svg refs.
- No name badge, no type badge, no edit/delete actions — just the heading, the code, and the two download buttons, per the existing header/footer chrome from the root layout.

Canvas/SVG refs and download handlers need client-side state, so the rendering + buttons live in a new client component, `PublicQrView` (`src/components/qr/PublicQrView.tsx`), taking the fetched `qrCode` as a prop. The server page component does the fetch/`notFound()` and renders `PublicQrView`.

## `SavedQrCard` changes

Add a `Share2` (lucide-react) icon button to the action bar in `src/components/qr/SavedQrCard.tsx`, wrapped in the existing `Tooltip` pattern ("Share"), rendered as a `Link` (`asChild`) to `/code/${qrCode.id}` — same pattern as the existing Edit button.

New button order, left to right: **Download, Share, Edit, Delete** — read-only actions first, mutating action next, destructive action last.

## Testing

- New `src/app/code/[id]/__tests__/page.test.tsx`: mocks `getPublicQrCode`, asserts the page renders the QR name/heading for a found code and calls `notFound()` (via a mocked `next/navigation`) for a missing one.
- Update `src/components/qr/__tests__/SavedQrCard.test.tsx` to assert the Share button links to `/code/${qrCode.id}`.

## Out of scope

- Revoking/regenerating a share link (the link is just the record's `id`, which is stable for the record's lifetime).
- Copy-to-clipboard or share-popover UX — the button is a plain navigation link, same as Edit.
- Dynamic `<title>`/OG metadata for the share page.
