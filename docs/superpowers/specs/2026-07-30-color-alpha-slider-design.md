# Color alpha slider

## Problem

`ColorPickerField` (`src/components/qr/ColorPickerField.tsx`) only supports two opacity states for a color: fully opaque, or (for `bgColor` only, via the `allowTransparent` toggle button) fully transparent. There's no way to pick a partial alpha value (e.g. a 50% translucent background), even though the data model already supports it — `hexColor` in `src/lib/qr-schema.ts` accepts both 6- and 8-digit hex, and the 8th byte is alpha.

## Goal

Add an alpha slider to `ColorPickerField`, for both the Foreground and Background swatches in `QrGeneratorForm`, so any alpha value (0-100%) can be picked directly instead of only 0% or 100%. Remove the existing `allowTransparent` toggle button — the slider supersedes it, including its 0% case.

## `ColorPickerField` changes

Drop the `allowTransparent` prop entirely. The component always renders:

- the existing swatch (`<input type="color">`) + hex text `<input>` row (unchanged), and
- a new alpha slider row below it: `<input type="range" min={0} max={100}>` plus a `%` readout.

**Reading alpha from `value`:** split the incoming hex string into a 6-hex base and an alpha byte. If `value` matches `^#[0-9a-fA-F]{6}$`, alpha is 100 (`FF`). If it matches `^#[0-9a-fA-F]{8}$`, alpha is the last byte converted from hex (0-255) to a 0-100 percentage (rounded). Anything else (empty/invalid) falls back to base `#FFFFFF` at 100%, matching the existing `opaqueBase` fallback behavior.

**Writing alpha:** on slider change, recompute the byte from the *current* base color (the color swatch/hex input keep driving the base independently) and the new percentage, converted back to a 0-255 hex byte. If the new percentage is 100, emit the plain 6-digit hex (no alpha suffix) — this keeps fully-opaque colors byte-identical to today's output, so existing saved codes and the `buildQrValue`/rendering path see no change for the common case. Otherwise emit the 8-digit form.

The swatch and text input are no longer ever `disabled` — removing the transparent toggle removes the only reason they were disabled. Typing an 8-digit hex directly into the text input still works as before and keeps the slider's displayed percentage in sync, since both read from the same `value` prop.

Remove: the `SquareDashed` icon import, the `TRANSPARENT_SUFFIX` const, the toggle `<button>`, and the `isTransparent`-driven `disabled`/styling branches.

## Call site changes

`src/components/qr/QrGeneratorForm.tsx`: drop `allowTransparent` from the `bgColor` field's `<ColorPickerField>` usage (line ~300). The `fgColor` usage needs no change — it already omits the prop.

## Tests

Rewrite `src/components/qr/__tests__/ColorPickerField.test.tsx` to cover the slider instead of the toggle button:

- renders the slider at 100% for a plain 6-digit `value`, and at the correct rounded percentage for an 8-digit `value`
- moving the slider to a value other than 100 calls `onChange` with the 8-digit hex form (base color preserved, new alpha byte appended)
- moving the slider to 100 calls `onChange` with the plain 6-digit form (alpha byte stripped)
- moving the slider to 0 calls `onChange` with the `...00` fully-transparent form (replaces the old "make transparent" button test)
- falls back to `#FFFFFF`-based output when starting from an invalid/empty `value`
- no more `allowTransparent` prop — every test constructs `<ColorPickerField>` the same way for both a foreground-like and background-like usage, since there's no longer a behavioral distinction between them

## Out of scope

Adding a tooltip to the transparent-background toggle button — moot, since that button is removed by this change.
