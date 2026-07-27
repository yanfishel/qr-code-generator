import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ColorPickerField } from "@/components/qr/ColorPickerField";

describe("ColorPickerField", () => {
  it("does not render a transparency toggle unless allowTransparent is set", () => {
    render(<ColorPickerField value="#FFFFFF" onChange={vi.fn()} />);
    expect(screen.queryByTitle(/transparent/i)).not.toBeInTheDocument();
  });

  it("shows the current hex value in the text input", () => {
    render(<ColorPickerField value="#112233" onChange={vi.fn()} allowTransparent />);
    expect(screen.getByPlaceholderText("#000000")).toHaveValue("#112233");
  });

  it("appends the alpha suffix to the current color when making it transparent", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColorPickerField value="#112233" onChange={onChange} allowTransparent />);

    await user.click(screen.getByTitle("Make the background transparent"));

    expect(onChange).toHaveBeenCalledWith("#11223300");
  });

  it("strips the alpha suffix when turning transparency back off", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColorPickerField value="#11223300" onChange={onChange} allowTransparent />);

    await user.click(screen.getByTitle("Use a solid background color"));

    expect(onChange).toHaveBeenCalledWith("#112233");
  });

  it("disables the color swatch and text input while transparent", () => {
    render(<ColorPickerField value="#FFFFFF00" onChange={vi.fn()} allowTransparent />);

    expect(screen.getByPlaceholderText("#000000")).toBeDisabled();
    expect(screen.getByTitle("Use a solid background color")).toHaveAttribute("aria-pressed", "true");
  });

  it("falls back to white as the base color when re-enabling from an invalid value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColorPickerField value="" onChange={onChange} allowTransparent />);

    await user.click(screen.getByTitle("Make the background transparent"));

    expect(onChange).toHaveBeenCalledWith("#FFFFFF00");
  });
});
