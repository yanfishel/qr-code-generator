import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PresetLogoPicker } from "@/components/qr/PresetLogoPicker";
import { logoPresets } from "@/lib/logo-presets";

describe("PresetLogoPicker", () => {
  it("renders a 'No logo' option plus one button per preset", () => {
    render(<PresetLogoPicker value={undefined} onChange={vi.fn()} />);

    expect(screen.getByTitle("No logo")).toBeInTheDocument();
    for (const preset of logoPresets) {
      expect(screen.getByTitle(preset.label)).toBeInTheDocument();
    }
  });

  it("marks 'No logo' as pressed when there is no value", () => {
    render(<PresetLogoPicker value={undefined} onChange={vi.fn()} />);
    expect(screen.getByTitle("No logo")).toHaveAttribute("aria-pressed", "true");
  });

  it("marks the matching preset as pressed when its data URL is selected", () => {
    const preset = logoPresets[0];
    render(<PresetLogoPicker value={preset.dataUrl} onChange={vi.fn()} />);

    expect(screen.getByTitle(preset.label)).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTitle("No logo")).toHaveAttribute("aria-pressed", "false");
  });

  it("does not mark any preset as pressed for a custom-uploaded logo", () => {
    render(<PresetLogoPicker value="data:image/png;base64,custom" onChange={vi.fn()} />);

    for (const preset of logoPresets) {
      expect(screen.getByTitle(preset.label)).toHaveAttribute("aria-pressed", "false");
    }
  });

  it("calls onChange with the preset's data URL when clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const preset = logoPresets[0];
    render(<PresetLogoPicker value={undefined} onChange={onChange} />);

    await user.click(screen.getByTitle(preset.label));

    expect(onChange).toHaveBeenCalledWith(preset.dataUrl);
  });

  it("calls onChange with undefined when 'No logo' is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PresetLogoPicker value={logoPresets[0].dataUrl} onChange={onChange} />);

    await user.click(screen.getByTitle("No logo"));

    expect(onChange).toHaveBeenCalledWith(undefined);
  });
});
