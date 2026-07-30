# Color Alpha Slider Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `ColorPickerField`'s background-only fully-transparent toggle button with a 0-100% alpha slider available on both the Foreground and Background color pickers in `QrGeneratorForm`.

**Architecture:** `ColorPickerField` (`src/components/qr/ColorPickerField.tsx`) drops its `allowTransparent` prop and toggle button, and always renders a `<input type="range">` below the existing swatch/hex row. The slider reads/writes the hex value's optional 8th (alpha) byte — 100% collapses back to a plain 6-digit hex, anything else appends the byte. `QrGeneratorForm.tsx` drops `allowTransparent` from its `bgColor` usage.

**Tech Stack:** React (client component), Vitest + React Testing Library, existing `Input` (`src/components/ui/input.tsx`), Tailwind v4 (`accent-primary` utility resolves via `--color-primary` in `src/app/globals.css:37`).

## Global Constraints

- `hexColor` in `src/lib/qr-schema.ts:4` already accepts both 6- and 8-digit hex — no schema change needed.
- At 100% alpha, `ColorPickerField` must emit a plain 6-digit hex (no `FF` suffix) so already-opaque saved colors are byte-identical to today's output.
- No tooltip work — the earlier ask for a tooltip on the transparent-background button is out of scope now that the button is removed (per `docs/superpowers/specs/2026-07-30-color-alpha-slider-design.md`).

---

### Task 1: Rewrite `ColorPickerField` with an alpha slider

**Files:**
- Modify: `src/components/qr/ColorPickerField.tsx`
- Test: `src/components/qr/__tests__/ColorPickerField.test.tsx`

**Interfaces:**
- Produces: `ColorPickerField({ value: string, onChange: (value: string) => void, id?: string }): JSX.Element` — note `allowTransparent` is removed from the prop type entirely.

- [ ] **Step 1: Replace the test file with slider-based tests**

Replace the full contents of `src/components/qr/__tests__/ColorPickerField.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ColorPickerField } from "@/components/qr/ColorPickerField";

describe("ColorPickerField", () => {
  it("shows the current hex value in the text input", () => {
    render(<ColorPickerField value="#112233" onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText("#000000")).toHaveValue("#112233");
  });

  it("renders the slider at 100% for a plain 6-digit value", () => {
    render(<ColorPickerField value="#112233" onChange={vi.fn()} />);
    expect(screen.getByRole("slider", { name: "Opacity" })).toHaveValue("100");
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("renders the slider at the rounded percentage for an 8-digit value", () => {
    render(<ColorPickerField value="#11223380" onChange={vi.fn()} />);
    expect(screen.getByRole("slider", { name: "Opacity" })).toHaveValue("50");
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("appends an alpha byte when the slider moves off 100%", () => {
    const onChange = vi.fn();
    render(<ColorPickerField value="#112233" onChange={onChange} />);

    fireEvent.change(screen.getByRole("slider", { name: "Opacity" }), {
      target: { value: "50" },
    });

    expect(onChange).toHaveBeenCalledWith("#11223380");
  });

  it("strips the alpha byte when the slider returns to 100%", () => {
    const onChange = vi.fn();
    render(<ColorPickerField value="#11223380" onChange={onChange} />);

    fireEvent.change(screen.getByRole("slider", { name: "Opacity" }), {
      target: { value: "100" },
    });

    expect(onChange).toHaveBeenCalledWith("#112233");
  });

  it("produces the fully-transparent suffix at 0%", () => {
    const onChange = vi.fn();
    render(<ColorPickerField value="#112233" onChange={onChange} />);

    fireEvent.change(screen.getByRole("slider", { name: "Opacity" }), {
      target: { value: "0" },
    });

    expect(onChange).toHaveBeenCalledWith("#11223300");
  });

  it("falls back to white as the base color when adjusting alpha from an invalid value", () => {
    const onChange = vi.fn();
    render(<ColorPickerField value="" onChange={onChange} />);

    fireEvent.change(screen.getByRole("slider", { name: "Opacity" }), {
      target: { value: "50" },
    });

    expect(onChange).toHaveBeenCalledWith("#FFFFFF80");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test src/components/qr/__tests__/ColorPickerField.test.tsx`
Expected: FAIL — `getByRole("slider", ...)` finds no element, and/or the old toggle-button tests are gone so failures come from the new assertions not matching current markup.

- [ ] **Step 3: Replace `ColorPickerField.tsx`**

Replace the full contents of `src/components/qr/ColorPickerField.tsx`:

```tsx
"use client";

import { Input } from "@/components/ui/input";

type ColorPickerFieldProps = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
};

function baseColor(value: string) {
  return /^#[0-9a-fA-F]{6}/.test(value) ? value.slice(0, 7) : "#FFFFFF";
}

function alphaPercent(value: string) {
  const match = /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})$/.exec(value);
  if (!match) return 100;
  return Math.round((parseInt(match[1], 16) / 255) * 100);
}

function withAlpha(base: string, percent: number) {
  if (percent >= 100) return base;
  const byte = Math.round((percent / 100) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${base}${byte}`;
}

export function ColorPickerField({ value, onChange, id }: ColorPickerFieldProps) {
  const base = baseColor(value);
  const alpha = alphaPercent(value);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={base}
          onChange={(e) => onChange(withAlpha(e.target.value, alpha))}
          className="h-9 w-10 shrink-0 cursor-pointer rounded-md border border-input bg-transparent p-1"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="font-mono"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={100}
          value={alpha}
          onChange={(e) => onChange(withAlpha(base, Number(e.target.value)))}
          aria-label="Opacity"
          className="h-1.5 flex-1 cursor-pointer accent-primary"
        />
        <span className="w-9 shrink-0 text-right font-mono text-xs text-muted-foreground">
          {alpha}%
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test src/components/qr/__tests__/ColorPickerField.test.tsx`
Expected: PASS (all 7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/qr/ColorPickerField.tsx src/components/qr/__tests__/ColorPickerField.test.tsx
git commit -m "Add alpha slider to ColorPickerField, remove transparent toggle"
```

---

### Task 2: Update `QrGeneratorForm` call site and verify the full suite

**Files:**
- Modify: `src/components/qr/QrGeneratorForm.tsx:300`

**Interfaces:**
- Consumes: `ColorPickerField` from Task 1 (no longer accepts `allowTransparent`).

- [ ] **Step 1: Drop the now-invalid prop**

In `src/components/qr/QrGeneratorForm.tsx`, change:

```tsx
<ColorPickerField value={field.value} onChange={field.onChange} allowTransparent />
```

to:

```tsx
<ColorPickerField value={field.value} onChange={field.onChange} />
```

- [ ] **Step 2: Type-check and lint**

Run: `pnpm lint`
Expected: no errors (this also catches the removed prop if any other call site still passed it — there is none per the current codebase).

- [ ] **Step 3: Run the full test suite**

Run: `pnpm test`
Expected: PASS — no other test file references `allowTransparent` or the old toggle button's `title` text.

- [ ] **Step 4: Commit**

```bash
git add src/components/qr/QrGeneratorForm.tsx
git commit -m "Drop allowTransparent from bgColor field now that the slider covers it"
```
