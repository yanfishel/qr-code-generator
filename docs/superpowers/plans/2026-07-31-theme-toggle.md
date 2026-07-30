# Theme Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a working Light/Dark/System theme switcher dropdown to the header, wired to a `next-themes` provider that isn't currently mounted anywhere in the app.

**Architecture:** Mount `next-themes`' `ThemeProvider` around the existing `ClerkProvider` in `src/app/layout.tsx` (`attribute="class"`, `defaultTheme="system"`, `enableSystem`), and add a new `ThemeToggle` dropdown component to `src/components/ui/` that reads/writes the theme via `useTheme()` and renders in the header next to the sign-in button / user block.

**Tech Stack:** Next.js App Router, React 19, `next-themes` (already a dependency, `^0.4.6`), Radix-based `DropdownMenu` (`src/components/ui/dropdown-menu.tsx`), `lucide-react` icons, Vitest + React Testing Library.

## Global Constraints

- `next-themes` is already in `package.json` (`^0.4.6`) — do not add or change any dependency.
- Use `attribute="class"` on `ThemeProvider` — `globals.css` keys dark-mode styling off a `.dark` class (`@custom-variant dark (&:is(.dark *));`), not a `data-theme` attribute.
- `defaultTheme="system"` and `enableSystem` are both required — `enableSystem` is what makes next-themes subscribe to `matchMedia('(prefers-color-scheme: dark)')` and live-update when the OS theme changes while "System" is selected. No custom media-query listener code.
- Theme persistence is handled entirely by `next-themes`' own `localStorage` read/write — no custom persistence code.
- New component goes in `src/components/ui/` (generic UI utility, matches where `sonner.tsx`'s existing `next-themes` usage lives), not `src/components/qr/`.
- Match the existing round icon-button visual style used by the footer's Mail/GitHub links: `flex size-[34px] items-center justify-center rounded-full border border-border/70 bg-background text-foreground hover:bg-muted`.
- Trigger icon must be dynamic: `Sun` for `"light"`, `Moon` for `"dark"`, `Monitor` for `"system"` (and as the pre-hydration fallback), all from `lucide-react`.

---

### Task 1: `ThemeToggle` component

**Files:**
- Create: `src/components/ui/theme-toggle.tsx`
- Test: `src/components/ui/__tests__/theme-toggle.test.tsx`

**Interfaces:**
- Consumes: `useTheme` from `next-themes` (`{ theme: string | undefined, setTheme: (theme: string) => void }`); `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuTrigger` from `@/components/ui/dropdown-menu` (existing, see `src/components/ui/dropdown-menu.tsx`).
- Produces: `ThemeToggle` — a no-props React component, default rendering export named `ThemeToggle` (named export, not default), consumed by Task 2 as `import { ThemeToggle } from "@/components/ui/theme-toggle";`.

- [ ] **Step 1: Write the failing test**

Create `src/components/ui/__tests__/theme-toggle.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const useThemeMock = vi.fn();
vi.mock("next-themes", () => ({
  useTheme: () => useThemeMock(),
}));

const { ThemeToggle } = await import("@/components/ui/theme-toggle");

describe("ThemeToggle", () => {
  const setThemeMock = vi.fn();

  beforeEach(() => {
    setThemeMock.mockReset();
    useThemeMock.mockReturnValue({ theme: "light", setTheme: setThemeMock });
  });

  it("renders a Sun icon on the trigger when the theme is light", () => {
    const { container } = render(<ThemeToggle />);

    expect(screen.getByRole("button", { name: "Toggle theme" })).toBeInTheDocument();
    expect(container.querySelector(".lucide-sun")).toBeInTheDocument();
  });

  it("renders a Moon icon on the trigger when the theme is dark", () => {
    useThemeMock.mockReturnValue({ theme: "dark", setTheme: setThemeMock });
    const { container } = render(<ThemeToggle />);

    expect(container.querySelector(".lucide-moon")).toBeInTheDocument();
  });

  it("renders a Monitor icon on the trigger when the theme is system", () => {
    useThemeMock.mockReturnValue({ theme: "system", setTheme: setThemeMock });
    const { container } = render(<ThemeToggle />);

    expect(container.querySelector(".lucide-monitor")).toBeInTheDocument();
  });

  it("falls back to a Monitor icon when the theme is not yet resolved", () => {
    useThemeMock.mockReturnValue({ theme: undefined, setTheme: setThemeMock });
    const { container } = render(<ThemeToggle />);

    expect(container.querySelector(".lucide-monitor")).toBeInTheDocument();
  });

  it("lists Light, Dark, and System options in the dropdown", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole("button", { name: "Toggle theme" }));

    expect(await screen.findByRole("menuitem", { name: /^Light/ })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /^Dark/ })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /^System/ })).toBeInTheDocument();
  });

  it("shows a check mark next to the currently active option", async () => {
    useThemeMock.mockReturnValue({ theme: "dark", setTheme: setThemeMock });
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole("button", { name: "Toggle theme" }));

    const darkItem = await screen.findByRole("menuitem", { name: /^Dark/ });
    expect(darkItem.querySelector(".lucide-check")).toBeInTheDocument();
    const lightItem = screen.getByRole("menuitem", { name: /^Light/ });
    expect(lightItem.querySelector(".lucide-check")).not.toBeInTheDocument();
  });

  it("calls setTheme with the selected option's value", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole("button", { name: "Toggle theme" }));
    await user.click(await screen.findByRole("menuitem", { name: /^Dark/ }));

    expect(setThemeMock).toHaveBeenCalledWith("dark");
  });

  it("calls setTheme with 'system' when System is selected", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole("button", { name: "Toggle theme" }));
    await user.click(await screen.findByRole("menuitem", { name: /^System/ }));

    expect(setThemeMock).toHaveBeenCalledWith("system");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test -- theme-toggle`
Expected: FAIL — `src/components/ui/theme-toggle.tsx` does not exist yet (module not found).

- [ ] **Step 3: Write the implementation**

Create `src/components/ui/theme-toggle.tsx`:

```tsx
"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, Check, type LucideIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const THEME_OPTIONS: { value: "light" | "dark" | "system"; label: string; icon: LucideIcon }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const TriggerIcon = THEME_OPTIONS.find((option) => option.value === theme)?.icon ?? Monitor;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Toggle theme"
          className="flex size-[34px] items-center justify-center rounded-full border border-border/70 bg-background text-foreground hover:bg-muted"
        >
          <TriggerIcon className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem key={value} onSelect={() => setTheme(value)}>
            <Icon className="size-4" />
            {label}
            {theme === value && <Check className="ml-auto size-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

Note: `theme` from `next-themes` is `undefined` until the provider resolves client-side (which, with a real `ThemeProvider` mounted, is also the pre-hydration window) — `THEME_OPTIONS.find(...)` returns `undefined` for an unmatched/undefined `theme`, so the `?? Monitor` fallback covers both "not yet resolved" and "system" with the same icon, which is the intended hydration-safe behavior.

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test -- theme-toggle`
Expected: PASS — all 8 tests green.

- [ ] **Step 5: Lint**

Run: `pnpm lint`
Expected: no new errors from `theme-toggle.tsx` or its test.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/theme-toggle.tsx src/components/ui/__tests__/theme-toggle.test.tsx
git commit -m "Add ThemeToggle dropdown component"
```

---

### Task 2: Wire `ThemeProvider` and mount `ThemeToggle` in the header

**Files:**
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: `ThemeToggle` from `@/components/ui/theme-toggle` (Task 1); `ThemeProvider` from `next-themes`.
- Produces: nothing consumed by later tasks — this is the final integration task.

- [ ] **Step 1: Add the `ThemeProvider` import and wrap `ClerkProvider`**

In `src/app/layout.tsx`, add to the imports (alongside the existing `@clerk/nextjs` import block):

```tsx
import { ThemeProvider } from "next-themes";
```

Then wrap the existing `<ClerkProvider appearance={{ theme: shadcn }}>...</ClerkProvider>` block (currently the direct child of `<body>`) with `ThemeProvider`:

```tsx
<body className="flex min-h-screen flex-col bg-page-gradient">
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <ClerkProvider appearance={{ theme: shadcn }}>
      {/* ...existing TooltipProvider / header / main / footer / Toaster tree, unchanged... */}
    </ClerkProvider>
  </ThemeProvider>
</body>
```

Only the indentation level of the existing `<ClerkProvider>` subtree changes — none of its own contents change in this step.

- [ ] **Step 2: Add `suppressHydrationWarning` to `<html>`**

Change:

```tsx
<html
  lang="en"
  className={cn("font-sans", display.variable, body.variable, plexMono.variable)}
>
```

to:

```tsx
<html
  lang="en"
  className={cn("font-sans", display.variable, body.variable, plexMono.variable)}
  suppressHydrationWarning
>
```

This is required because `next-themes` sets the `.dark` class via an inline script before React hydrates; without `suppressHydrationWarning` on the element it mutates, React logs a hydration-mismatch warning on every load.

- [ ] **Step 3: Import and render `ThemeToggle` in the header**

Add to the imports:

```tsx
import { ThemeToggle } from "@/components/ui/theme-toggle";
```

In the header's right-hand `<div className="flex items-center gap-3 justify-self-end">` (currently containing the `signed-out`/`signed-in` `<Show>` blocks for `SignInButton`/`UserButton`), add `<ThemeToggle />` as the last child:

```tsx
<div className="flex items-center gap-3 justify-self-end">
  <Show when="signed-out">
    <SignInButton mode="modal">
      <Button variant="default" size="sm">
        Sign In
      </Button>
    </SignInButton>
  </Show>
  <Show when="signed-in">
    <UserButton />
  </Show>
  <ThemeToggle />
</div>
```

- [ ] **Step 4: Run the full test suite**

Run: `pnpm test`
Expected: PASS — no existing test imports/renders `layout.tsx` directly (confirmed: no test file exists for it), so this step is a regression check on the rest of the suite, particularly `sonner.tsx`-adjacent tests if any exist and the new `theme-toggle.test.tsx` from Task 1.

- [ ] **Step 5: Lint**

Run: `pnpm lint`
Expected: no new errors.

- [ ] **Step 6: Manual verification in the browser**

`layout.tsx` has no existing unit test coverage in this codebase (it renders `ClerkProvider` and real header/footer markup — there's no precedent for mocking that in a test here), so this task's verification is manual, per this repo's convention of checking UI changes live before calling them done:

1. Run `pnpm dev` and open the app in a browser.
2. Confirm the round theme-toggle button appears in the header, to the right of the Sign In button (signed out) and to the right of the user avatar (signed in — sign in first to check both states).
3. Click it, confirm the dropdown shows Light / Dark / System with a check mark next to the active one (System, by default).
4. Select "Dark": page switches to dark palette immediately, trigger icon changes to the moon, `<html>` gains class `dark` (verify in DevTools Elements panel).
5. Select "Light": page switches to light palette, trigger icon changes to the sun, `dark` class removed.
6. Select "System": trigger icon changes to the monitor icon; page matches the OS's current light/dark setting.
7. With "System" selected, toggle the OS-level light/dark setting (or use Chrome DevTools' Rendering tab → "Emulate CSS media feature prefers-color-scheme") and confirm the page's theme updates live, without a reload.
8. Reload the page after selecting "Dark" (or "Light") explicitly — confirm the choice persisted (check `localStorage.theme` in DevTools, and that the page renders in the correct theme with no flash of the wrong theme).

- [ ] **Step 7: Commit**

```bash
git add src/app/layout.tsx
git commit -m "Wire up next-themes ThemeProvider and mount ThemeToggle in the header"
```
