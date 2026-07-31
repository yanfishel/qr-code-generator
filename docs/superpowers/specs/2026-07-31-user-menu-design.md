# Custom user account dropdown

## Problem

The header currently renders Clerk's stock `<UserButton />` (`src/app/layout.tsx:124`) for signed-in visitors. It works, but its popover is styled by Clerk's own `shadcn` appearance theme rather than the app's actual design system (viewfinder/teal accent, `ThemeToggle`'s icon-button conventions, etc.), so it visually stands apart from the rest of the header.

## Goal

Replace `<UserButton />` with an in-house dropdown that matches the app's existing header dropdown pattern (`ThemeToggle`), while still using Clerk's own data and actions — no custom account UI, no new routes.

## `UserMenu` component

New file `src/components/qr/UserMenu.tsx` (app-specific, not a shadcn primitive, so it belongs in `qr/` per `CLAUDE.md` conventions — same reasoning that keeps `ThemeToggle` itself in `ui/` doesn't apply here since this component is Clerk/account-specific, not a generic UI utility).

- **Trigger:** a round avatar button, `size-[34px] overflow-hidden rounded-full border border-border/70`, containing an `<img src={user.imageUrl}>` filling the circle (`size-full object-cover`). `aria-label="Account menu"`. Wrapped in `DropdownMenuTrigger asChild` from the existing `src/components/ui/dropdown-menu.tsx`, matching `ThemeToggle`'s trigger pattern.
- **Dropdown content** (`DropdownMenuContent align="end"`):
  1. A non-interactive header row (`DropdownMenuLabel`, className override since the default is small/muted): a larger avatar (`size-9 rounded-full`) plus a text column — name (`user.fullName ?? user.username ?? "Account"`) and email (`user.primaryEmailAddress?.emailAddress`), matching the reference screenshot's layout.
  2. `DropdownMenuSeparator`.
  3. **Manage Account** item, `Settings` icon (lucide-react), `onSelect={() => openUserProfile()}` — opens Clerk's own account-management modal, the same one the stock `UserButton` opens. No new page/route needed.
  4. **Sign Out** item, `variant="destructive"`, `LogOut` icon, `onSelect={() => signOut({ redirectUrl: "/" })}` — `/` matches the app's existing post-auth redirect target (`NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/`).
- Data comes from `useUser()`; actions come from `useClerk()` (`openUserProfile`, `signOut`) — both from `@clerk/nextjs`.
- If `user` is not yet loaded, the component renders `null`. This is a defensive fallback only — the call site keeps it inside the existing `<Show when="signed-in">` guard in `layout.tsx`, so in practice it's never rendered while signed out.

## Placement

`src/app/layout.tsx`: replace `<UserButton />` at line 124 with `<UserMenu />`, still wrapped in the existing `<Show when="signed-in">`. Remove the now-unused `UserButton` import from `@clerk/nextjs`.

## Tests

New `src/components/qr/__tests__/UserMenu.test.tsx`, mocking `@clerk/nextjs`'s `useUser`/`useClerk` (matching how `theme-toggle.test.tsx` mocks `next-themes`):

- renders the trigger button with the user's avatar
- opening the dropdown shows the name and email in the header row
- clicking "Manage Account" calls the mocked `openUserProfile`
- clicking "Sign Out" calls the mocked `signOut` with `{ redirectUrl: "/" }`

## Out of scope

- Any change to Clerk's own account-management modal UI (opened via `openUserProfile()`) — that's Clerk's hosted component, not something this app renders.
- `ClerkProvider`'s `appearance={{ theme: shadcn }}` in `layout.tsx` stays as-is; it still styles that modal and the sign-in modal, just no longer the header trigger/popover.
