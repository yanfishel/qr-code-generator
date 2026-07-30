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
