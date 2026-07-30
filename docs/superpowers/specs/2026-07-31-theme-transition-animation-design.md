# Theme transition animation

## Problem

Switching theme via `ThemeToggle` (`src/components/ui/theme-toggle.tsx`) currently swaps the `.dark` class instantly, with only each element's own Tailwind `transition-colors`/`transition-all` softening individual color changes. There's no cohesive, deliberate transition for the theme switch itself.

## Goal

Add a circular "reveal" transition, growing from the point of activation, using the browser's [View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API). Gracefully no-op (instant switch, today's behavior) in browsers without support (Firefox stable) or when the user prefers reduced motion.

## `ThemeToggle` changes

`src/components/ui/theme-toggle.tsx`:

- Add a `triggerRef` (`useRef<HTMLButtonElement>(null)`) on the trigger `<button>`, and a `pointerOriginRef` (`useRef<{ x: number; y: number } | null>(null)`).
- Each `DropdownMenuRadioItem` gets `onPointerDown={(e) => { pointerOriginRef.current = { x: e.clientX, y: e.clientY }; }}` — records where the user clicked, without touching theme-selection logic (which stays entirely on `DropdownMenuRadioGroup`'s `onValueChange`, so keyboard selection — Enter/Space — keeps working exactly as it does today; Radix's keyboard activation path doesn't dispatch `onPointerDown`, so `pointerOriginRef` stays `null` for keyboard-triggered changes).
- Replace `onValueChange={setTheme}` with `onValueChange={handleThemeChange}`, where:

```tsx
function handleThemeChange(value: string) {
  const origin = pointerOriginRef.current ?? triggerCenter(triggerRef.current);
  pointerOriginRef.current = null;

  if (!("startViewTransition" in document) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    setTheme(value);
    return;
  }

  const root = document.documentElement;
  const radius = Math.hypot(
    Math.max(origin.x, window.innerWidth - origin.x),
    Math.max(origin.y, window.innerHeight - origin.y),
  );
  root.style.setProperty("--theme-x", `${origin.x}px`);
  root.style.setProperty("--theme-y", `${origin.y}px`);
  root.style.setProperty("--theme-radius", `${radius}px`);

  document.startViewTransition(() => {
    flushSync(() => setTheme(value));
  });
}
```

- `triggerCenter(el)` — a small helper returning the trigger button's bounding-rect center (`{ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }`), used as the origin when there's no recorded pointer position (keyboard activation). Falls back to viewport center (`window.innerWidth / 2`, `window.innerHeight / 2`) if `el` is `null` (defensive; shouldn't happen since the ref is always attached).
- `flushSync` imported from `react-dom` — required because `document.startViewTransition`'s callback must synchronously mutate the DOM to the "after" state for the API to capture it correctly; a bare `setTheme(value)` inside the callback would otherwise apply asynchronously (React 19's default batching), and the API would capture the "before" state as both snapshots.
- Feature/motion detection (`!document.startViewTransition || prefers-reduced-motion`) falls through to today's plain `setTheme(value)` — no visual regression for unsupported browsers or users who've asked for reduced motion.

## `globals.css` changes

Add, near the existing `.dark` block:

```css
@media (prefers-reduced-motion: no-preference) {
  ::view-transition-old(root) {
    animation: none;
  }

  ::view-transition-new(root) {
    animation: theme-reveal 0.5s ease-in-out;
    clip-path: circle(0px at var(--theme-x, 50%) var(--theme-y, 50%));
  }

  @keyframes theme-reveal {
    to {
      clip-path: circle(var(--theme-radius, 150%) at var(--theme-x, 50%) var(--theme-y, 50%));
    }
  }
}
```

Wrapping the whole block in `@media (prefers-reduced-motion: no-preference)` is a second, CSS-level guard alongside the JS check in `ThemeToggle` (belt-and-suspenders: the JS check skips calling `startViewTransition` at all under reduced motion, so this CSS never actually runs in that case today — but it's cheap insurance against the animation still firing if `startViewTransition` is ever invoked from a future call site that forgets the JS check).

## `layout.tsx` change

Add `disableTransitionOnChange` to the existing `<ThemeProvider attribute="class" defaultTheme="system" enableSystem>` call. Without it, every themed element's own `transition-colors`/`transition-all` (Tailwind) plays at the same time as the circular reveal, producing a double/muddy effect. This resolves the "no disableTransitionOnChange" item parked as a Minor in the original theme-toggle PR's final review.

## Tests

`src/components/ui/__tests__/theme-toggle.test.tsx`:

- jsdom has no `document.startViewTransition`, so every existing test (click/keyboard → `setTheme` called with the right value) keeps passing unmodified via the fallback branch — no test changes needed for those.
- Add one new test: mock `document.startViewTransition` (e.g. `vi.fn((cb) => { cb(); return { finished: Promise.resolve(), ready: Promise.resolve(), updateCallbackDone: Promise.resolve() }; })`) and `window.matchMedia` to report `matches: false` for reduced-motion, then click a theme option and assert `document.startViewTransition` was called and `setTheme` was still invoked with the right value (i.e. the callback passed to it actually ran).
- Add one test for the reduced-motion path: mock `document.startViewTransition` present but `matchMedia("(prefers-reduced-motion: reduce)").matches: true`, click an option, assert `document.startViewTransition` was NOT called and `setTheme` was still called directly.

## Out of scope

- Any change to the transition's duration/easing being configurable — hardcoded `0.5s ease-in-out`, matching the scope of "one deliberate animation," not a themeable animation system.
- Safari/Firefox-specific fallback animations (e.g. a manual JS-driven clip-path circle for browsers without the native API) — out of scope; those browsers just get the instant switch they have today.
