# Public QR Share Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Share" button to `SavedQrCard` that links to a permanent, public `/code/[id]` page showing just that QR code and PNG/SVG download buttons.

**Architecture:** A new `getPublicQrCode(id)` server action (unauthenticated, unlike the owner-scoped `getQrCode`) backs a new public route `src/app/code/[id]/page.tsx`, which renders a heading plus a new client component `PublicQrView` (the QR preview + download buttons, extracted so it can hold canvas/svg refs). `SavedQrCard` gets a new `Share2` icon button linking to `/code/${qrCode.id}`.

**Tech Stack:** Next.js App Router (server + client components), Prisma, Vitest + React Testing Library, existing `QrCanvas`/`QrSvg`/`ViewfinderFrame`/`useQrDownload`.

## Global Constraints

- The share route is `/code/[id]` — public, no `auth.protect()`.
- The public data accessor is a new function `getPublicQrCode(id: string)` in `src/actions/qr-actions.ts` — it must NOT call `getCurrentUser()` (throws when signed out) and must NOT filter by `userId` (the existing `getQrCode` stays owner-scoped, for `/saved/[id]/edit` only — do not merge or reuse between the two).
- The share page shows only: a heading (QR name, falling back to `qrTypeLabels[qrCode.type]` when unnamed) and the QR code with PNG/SVG download buttons. No type badge, no edit/delete actions.
- The QR preview on the share page renders at the code's own persisted `qrCode.size`, not the fixed 200px thumbnail size used in `SavedQrCard`.
- `SavedQrCard`'s action bar order becomes: **Download, Share, Edit, Delete**.
- The Share button is a plain navigation `Link` (no copy-to-clipboard, no popover).

---

### Task 1: `PublicQrView` component

**Files:**
- Create: `src/components/qr/PublicQrView.tsx`
- Test: `src/components/qr/__tests__/PublicQrView.test.tsx`

**Interfaces:**
- Consumes: `QrCanvas` (`src/components/qr/QrCanvas.tsx`), `QrSvg` (`src/components/qr/QrSvg.tsx`), `ViewfinderFrame` (`src/components/qr/ViewfinderFrame.tsx`), `useQrDownload` (`src/hooks/use-qr-download.ts`) — all existing, unchanged.
- Produces: `PublicQrView({ qrCode: QrCode }): JSX.Element` (default export is NOT used — named export `PublicQrView`), for Task 2's page to render.

- [ ] **Step 1: Write the failing test**

Create `src/components/qr/__tests__/PublicQrView.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { QrCode } from "@prisma/client";

const downloadMock = vi.fn();
vi.mock("@/hooks/use-qr-download", () => ({
  useQrDownload: () => downloadMock,
}));

vi.mock("@/components/qr/QrCanvas", () => ({
  QrCanvas: ({
    ref,
    value,
    size,
  }: {
    ref?: React.Ref<HTMLCanvasElement>;
    value: string;
    size: number;
  }) => <canvas ref={ref} data-testid="qr-canvas" data-value={value} data-size={size} />,
}));

vi.mock("@/components/qr/QrSvg", () => ({
  QrSvg: ({ ref, value }: { ref?: React.Ref<SVGSVGElement>; value: string }) => (
    <svg ref={ref} data-testid="qr-svg" data-value={value} />
  ),
}));

const { PublicQrView } = await import("@/components/qr/PublicQrView");

function makeQrCode(overrides: Partial<QrCode> = {}): QrCode {
  return {
    id: "qr_1",
    userId: "user_1",
    name: "My QR",
    type: "URL",
    data: "https://example.com",
    fgColor: "#111111",
    bgColor: "#eeeeee",
    size: 512,
    level: "M",
    dotStyle: "SQUARE",
    finderFrameStyle: "SQUARE",
    finderMarkerStyle: "SQUARE",
    margin: 2,
    logoDataUrl: null,
    logoSize: 20,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("PublicQrView", () => {
  beforeEach(() => {
    downloadMock.mockReset();
  });

  it("renders the QR canvas at the code's own persisted size", () => {
    render(<PublicQrView qrCode={makeQrCode({ size: 512 })} />);

    expect(screen.getByTestId("qr-canvas")).toHaveAttribute("data-size", "512");
  });

  it("renders the QR canvas with the code's value", () => {
    render(<PublicQrView qrCode={makeQrCode({ data: "https://example.com" })} />);

    expect(screen.getByTestId("qr-canvas")).toHaveAttribute("data-value", "https://example.com");
  });

  it("downloads the PNG using the canvas ref and the saved name", async () => {
    const user = userEvent.setup();
    render(<PublicQrView qrCode={makeQrCode({ name: "Business card" })} />);

    await user.click(screen.getByRole("button", { name: "PNG" }));

    expect(downloadMock).toHaveBeenCalledTimes(1);
    const [canvasArg, filenameArg] = downloadMock.mock.calls[0];
    expect(canvasArg).toBeInstanceOf(HTMLCanvasElement);
    expect(filenameArg).toBe("Business card");
  });

  it("downloads the SVG using the svg ref and the saved name", async () => {
    const user = userEvent.setup();
    render(<PublicQrView qrCode={makeQrCode({ name: "Business card" })} />);

    await user.click(screen.getByRole("button", { name: "SVG" }));

    expect(downloadMock).toHaveBeenCalledTimes(1);
    const [svgArg, filenameArg] = downloadMock.mock.calls[0];
    expect(svgArg.tagName.toLowerCase()).toBe("svg");
    expect(filenameArg).toBe("Business card");
  });

  it("falls back to the id as the download filename when there is no name", async () => {
    const user = userEvent.setup();
    render(<PublicQrView qrCode={makeQrCode({ id: "qr_42", name: null })} />);

    await user.click(screen.getByRole("button", { name: "PNG" }));

    expect(downloadMock).toHaveBeenCalledWith(expect.any(HTMLCanvasElement), "qr_42");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test PublicQrView`
Expected: FAIL — `Cannot find module '@/components/qr/PublicQrView'` (the file doesn't exist yet).

- [ ] **Step 3: Write minimal implementation**

Create `src/components/qr/PublicQrView.tsx`:

```tsx
"use client";

import { useRef } from "react";
import { Download } from "lucide-react";
import type { QrCode } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ViewfinderFrame } from "@/components/qr/ViewfinderFrame";
import { QrCanvas } from "@/components/qr/QrCanvas";
import { QrSvg } from "@/components/qr/QrSvg";
import { useQrDownload } from "@/hooks/use-qr-download";

type PublicQrViewProps = {
  qrCode: QrCode;
};

export function PublicQrView({ qrCode }: PublicQrViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const download = useQrDownload();

  const imageSettings = qrCode.logoDataUrl
    ? {
        src: qrCode.logoDataUrl,
        height: Math.round(qrCode.size * (qrCode.logoSize / 100)),
        width: Math.round(qrCode.size * (qrCode.logoSize / 100)),
        excavate: true,
      }
    : undefined;

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-6">
      <ViewfinderFrame active className="w-full">
        <Card className="aspect-square w-full gap-0 bg-soft-gradient py-0 shadow-lg shadow-primary/10 ring-1 ring-primary/15">
          <CardContent className="flex h-full items-center justify-center p-5">
            <QrCanvas
              ref={canvasRef}
              value={qrCode.data}
              size={qrCode.size}
              fgColor={qrCode.fgColor}
              bgColor={qrCode.bgColor}
              level={qrCode.level}
              marginSize={qrCode.margin}
              dotStyle={qrCode.dotStyle}
              finderFrameStyle={qrCode.finderFrameStyle}
              finderMarkerStyle={qrCode.finderMarkerStyle}
              imageSettings={imageSettings}
              style={{ width: "100%", height: "auto" }}
            />
            <QrSvg
              ref={svgRef}
              value={qrCode.data}
              size={qrCode.size}
              fgColor={qrCode.fgColor}
              bgColor={qrCode.bgColor}
              level={qrCode.level}
              marginSize={qrCode.margin}
              dotStyle={qrCode.dotStyle}
              finderFrameStyle={qrCode.finderFrameStyle}
              finderMarkerStyle={qrCode.finderMarkerStyle}
              imageSettings={imageSettings}
              className="hidden"
            />
          </CardContent>
        </Card>
      </ViewfinderFrame>

      <div className="flex flex-wrap justify-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => download(canvasRef.current, qrCode.name || qrCode.id)}
        >
          <Download /> PNG
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => download(svgRef.current, qrCode.name || qrCode.id)}
        >
          <Download /> SVG
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test PublicQrView`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/qr/PublicQrView.tsx src/components/qr/__tests__/PublicQrView.test.tsx
git commit -m "feat: add PublicQrView component for the public QR share page"
```

---

### Task 2: `getPublicQrCode` action + `/code/[id]` page

**Files:**
- Modify: `src/actions/qr-actions.ts` (add `getPublicQrCode`)
- Create: `src/app/code/[id]/page.tsx`
- Test: `src/app/code/[id]/__tests__/page.test.tsx`

**Interfaces:**
- Consumes: `PublicQrView({ qrCode: QrCode })` from Task 1; `qrTypeLabels: Record<QrType, string>` from `src/lib/qr-schema.ts` (existing).
- Produces: `getPublicQrCode(id: string): Promise<QrCode | null>` (exported from `src/actions/qr-actions.ts`); default export `PublicQrCodePage({ params: Promise<{ id: string }> })` from `src/app/code/[id]/page.tsx`, for Task 3's Share link to target.

- [ ] **Step 1: Write the failing test**

Create `src/app/code/[id]/__tests__/page.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { QrCode } from "@prisma/client";

const getPublicQrCodeMock = vi.fn();
vi.mock("@/actions/qr-actions", () => ({
  getPublicQrCode: getPublicQrCodeMock,
}));

const notFoundMock = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
}));

vi.mock("@/components/qr/PublicQrView", () => ({
  PublicQrView: ({ qrCode }: { qrCode: QrCode }) => (
    <div data-testid="public-qr-view" data-id={qrCode.id} />
  ),
}));

const { default: PublicQrCodePage } = await import("@/app/code/[id]/page");

function makeQrCode(overrides: Partial<QrCode> = {}): QrCode {
  return {
    id: "qr_1",
    userId: "user_1",
    name: "My QR",
    type: "URL",
    data: "https://example.com",
    fgColor: "#000000",
    bgColor: "#FFFFFF",
    size: 512,
    level: "M",
    dotStyle: "SQUARE",
    finderFrameStyle: "SQUARE",
    finderMarkerStyle: "SQUARE",
    margin: 2,
    logoDataUrl: null,
    logoSize: 20,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

function renderPage(id = "qr_1") {
  return PublicQrCodePage({ params: Promise.resolve({ id }) });
}

describe("PublicQrCodePage", () => {
  beforeEach(() => {
    getPublicQrCodeMock.mockReset();
    notFoundMock.mockClear();
  });

  it("renders the QR name as the heading", async () => {
    getPublicQrCodeMock.mockResolvedValue(makeQrCode({ name: "Business card" }));

    const ui = await renderPage();
    render(ui);

    expect(screen.getByRole("heading", { name: "Business card", level: 1 })).toBeInTheDocument();
  });

  it("falls back to the type label when the code has no name", async () => {
    getPublicQrCodeMock.mockResolvedValue(makeQrCode({ name: null, type: "WIFI" }));

    const ui = await renderPage();
    render(ui);

    expect(screen.getByRole("heading", { name: "Wi-Fi", level: 1 })).toBeInTheDocument();
  });

  it("passes the loaded QR code through to PublicQrView", async () => {
    getPublicQrCodeMock.mockResolvedValue(makeQrCode({ id: "qr_7" }));

    const ui = await renderPage("qr_7");
    render(ui);

    expect(screen.getByTestId("public-qr-view")).toHaveAttribute("data-id", "qr_7");
  });

  it("looks up the QR code by the id from the route params", async () => {
    getPublicQrCodeMock.mockResolvedValue(makeQrCode());

    await renderPage("qr_123");

    expect(getPublicQrCodeMock).toHaveBeenCalledWith("qr_123");
  });

  it("calls notFound when no QR code matches the id", async () => {
    getPublicQrCodeMock.mockResolvedValue(null);

    await expect(renderPage()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test "app/code"`
Expected: FAIL — `Cannot find module '@/app/code/[id]/page'` (neither the action nor the page exist yet).

- [ ] **Step 3: Write minimal implementation**

Add to `src/actions/qr-actions.ts` (after `getQrCode`, around line 38):

```ts
export async function getPublicQrCode(id: string) {
  return prisma.qrCode.findUnique({ where: { id } });
}
```

Create `src/app/code/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { getPublicQrCode } from "@/actions/qr-actions";
import { PublicQrView } from "@/components/qr/PublicQrView";
import { qrTypeLabels } from "@/lib/qr-schema";

export const dynamic = "force-dynamic";

type PublicQrCodePageProps = {
  params: Promise<{ id: string }>;
};

export default async function PublicQrCodePage({ params }: PublicQrCodePageProps) {
  const { id } = await params;
  const qrCode = await getPublicQrCode(id);
  if (!qrCode) notFound();

  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <p className="font-mono text-xs tracking-widest text-primary uppercase">QR Code</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {qrCode.name || qrTypeLabels[qrCode.type]}
        </h1>
      </div>
      <PublicQrView qrCode={qrCode} />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test "app/code"`
Expected: PASS (5 tests)

- [ ] **Step 5: Run the full test suite**

Run: `pnpm test`
Expected: PASS (no regressions in existing suites)

- [ ] **Step 6: Commit**

```bash
git add src/actions/qr-actions.ts src/app/code/[id]/page.tsx src/app/code/[id]/__tests__/page.test.tsx
git commit -m "feat: add public /code/[id] QR share page"
```

---

### Task 3: Share button on `SavedQrCard`

**Files:**
- Modify: `src/components/qr/SavedQrCard.tsx`
- Modify: `src/components/qr/__tests__/SavedQrCard.test.tsx`

**Interfaces:**
- Consumes: route `/code/[id]` from Task 2 (link target only, not imported).
- Produces: nothing consumed by later tasks (final task in this plan).

- [ ] **Step 1: Write the failing test**

Add to `src/components/qr/__tests__/SavedQrCard.test.tsx`, in the `describe("SavedQrCard", ...)` block, next to the existing `"links the edit button to the code's edit page"` test:

```tsx
  it("links the share button to the code's public page", () => {
    renderCard(<SavedQrCard qrCode={makeQrCode({ id: "qr_7" })} onDelete={vi.fn()} />);

    expect(screen.getByRole("link", { name: /share/i })).toHaveAttribute("href", "/code/qr_7");
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test SavedQrCard`
Expected: FAIL — no link with accessible name matching `/share/i` exists yet.

- [ ] **Step 3: Write minimal implementation**

In `src/components/qr/SavedQrCard.tsx`, update the icon import (line 5) to include `Share2`:

```tsx
import { Trash2, Download, Pencil, Share2 } from "lucide-react";
```

Then insert a new Share button between the closing `</DropdownMenu>` (line 113) and the Edit `<Tooltip>` block (starting line 114):

```tsx
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                className="cursor-pointer"
                aria-label="Share"
                asChild
              >
                <Link href={`/code/${qrCode.id}`}>
                  <Share2 />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Share</TooltipContent>
          </Tooltip>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test SavedQrCard`
Expected: PASS (all `SavedQrCard` tests, including the new one)

- [ ] **Step 5: Run the full test suite**

Run: `pnpm test`
Expected: PASS (no regressions)

- [ ] **Step 6: Commit**

```bash
git add src/components/qr/SavedQrCard.tsx src/components/qr/__tests__/SavedQrCard.test.tsx
git commit -m "feat: add Share button to SavedQrCard linking to the public QR page"
```
