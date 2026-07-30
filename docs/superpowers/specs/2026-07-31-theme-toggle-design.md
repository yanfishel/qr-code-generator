# Theme toggle

## Problem

`globals.css` already defines a full light/dark palette (`.dark` selector, `@custom-variant dark (&:is(.dark *));`), and `next-themes` is already a dependency — `src/components/ui/sonner.tsx` even calls `useTheme()` from it. But no `ThemeProvider` is mounted anywhere in the app, so nothing ever applies the `.dark` class: the app is stuck in light mode regardless of the visitor's OS setting, and `sonner.tsx`'s `useTheme()` call always falls back to its `"system"` default with no provider backing it.

## Goal

Wire up `next-themes` properly and add a theme switcher dropdown to the header, to the right of the sign-in button / user block, with three options — Light, Dark, System (default) — matching the app's existing header icon-button and dropdown-menu conventions.

## Provider setup

`src/app/layout.tsx`:

- Wrap the existing `<ClerkProvider>` subtree in `next-themes`' `ThemeProvider`, configured with `attribute="class"` (toggles the `.dark` class `globals.css` already keys off), `defaultTheme="system"`, and `enableSystem`.
- Add `suppressHydrationWarning` to the `<html>` element — `next-themes` sets the class via an inline script before React hydrates, which otherwise triggers a hydration-mismatch warning on that node.
- `enableSystem` is what makes the "System" option live-track OS theme changes: `next-themes` internally subscribes to `matchMedia('(prefers-color-scheme: dark)')` and re-applies the `.dark` class whenever the OS setting changes while `theme === "system"`, with no polling or extra code needed here.
- Theme choice persists via `next-themes`' own `localStorage` handling (default key `"theme"|"system"|"light"|"dark"`) — no custom persistence code.

## `ThemeToggle` component

New file `src/components/ui/theme-toggle.tsx` (generic UI utility, alongside `sonner.tsx`'s existing `next-themes` usage — not QR-specific, so it doesn't belong under `src/components/qr/`).

- **Trigger:** a round icon-only button, `flex size-[34px] items-center justify-center rounded-full border border-border/70 bg-background text-foreground hover:bg-muted` (the same visual treatment as the footer's Mail/GitHub icon buttons), with `aria-label="Toggle theme"`. Wraps a `DropdownMenuTrigger` from the existing `src/components/ui/dropdown-menu.tsx` (already used by `SavedQrCard`'s download button).
- **Trigger icon (dynamic):** reflects the *selected* mode, not the resolved OS state — `Sun` (lucide-react) for `"light"`, `Moon` for `"dark"`, `Monitor` for `"system"`. Before the component has mounted client-side, `next-themes`' `theme` value is `undefined`; render the neutral `Monitor` icon in that window (a `mounted` state flipped in a `useEffect`) to avoid a hydration mismatch, matching the standard next-themes toggle pattern.
- **Dropdown content:** three `DropdownMenuItem`s — Light (`Sun`), Dark (`Moon`), System (`Monitor`) — each with a label and calling `setTheme("light" | "dark" | "system")` on select. The item matching the current `theme` shows a trailing `Check` icon (lucide-react).

## Placement

`src/app/layout.tsx`, inside the existing `<div className="flex items-center gap-3 justify-self-end">` that already holds the signed-out `SignInButton` and signed-in `UserButton` (both behind `<Show>`). Add `<ThemeToggle />` as the last child of that div, so it renders to the right of whichever of the two is shown.

## Tests

New `src/components/ui/__tests__/theme-toggle.test.tsx`, mocking `next-themes`' `useTheme` (matching how existing tests mock sibling modules per `CLAUDE.md`'s testing conventions):

- renders the `Monitor` icon before mount / when `theme` is `undefined`
- renders `Sun` / `Moon` / `Monitor` on the trigger for `theme` = `"light"` / `"dark"` / `"system"` respectively
- opening the dropdown shows all three options, with a `Check` next to the one matching the current `theme`
- selecting an option calls the mocked `setTheme` with the corresponding value

No `TooltipProvider` wrapper needed for this component (the trigger uses `aria-label`, not a `Tooltip`), unlike `SavedQrCard`'s icon buttons.

## Out of scope

- Any change to `sonner.tsx` — it already reads `useTheme()` correctly and just needs the provider to exist; no code change there.
- Per-user server-side theme persistence (e.g. a `User.theme` column) — `next-themes`' `localStorage` persistence is sufficient for this feature.
