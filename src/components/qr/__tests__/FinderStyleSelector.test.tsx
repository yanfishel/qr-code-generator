import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FinderStyleSelector } from "@/components/qr/FinderStyleSelector";

describe("FinderStyleSelector", () => {
  it("renders a button for every finder style", () => {
    render(<FinderStyleSelector value="SQUARE" onChange={vi.fn()} />);

    for (const label of ["Square", "Rounded", "Circle"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("marks only the selected style as pressed", () => {
    render(<FinderStyleSelector value="CIRCLE" onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Circle" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Square" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Rounded" })).toHaveAttribute("aria-pressed", "false");
  });

  it("calls onChange with the clicked style", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FinderStyleSelector value="SQUARE" onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Rounded" }));

    expect(onChange).toHaveBeenCalledWith("ROUNDED");
  });

  it("defaults to a filled glyph, and switches to a hollow one when filled=false", () => {
    const { container: filledContainer } = render(<FinderStyleSelector value="SQUARE" onChange={vi.fn()} />);
    const filledGlyph = filledContainer.querySelector('[aria-hidden="true"]');
    expect(filledGlyph?.className).toContain("bg-current");

    const { container: hollowContainer } = render(
      <FinderStyleSelector value="SQUARE" onChange={vi.fn()} filled={false} />,
    );
    const hollowGlyph = hollowContainer.querySelector('[aria-hidden="true"]');
    expect(hollowGlyph?.className).toContain("border-current");
    expect(hollowGlyph?.className).not.toContain("bg-current");
  });
});
