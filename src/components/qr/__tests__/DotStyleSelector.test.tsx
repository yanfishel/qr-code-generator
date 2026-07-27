import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DotStyleSelector } from "@/components/qr/DotStyleSelector";

describe("DotStyleSelector", () => {
  it("renders a button for every dot style", () => {
    render(<DotStyleSelector value="SQUARE" onChange={vi.fn()} />);

    for (const label of ["Square", "Rounded", "Dots", "Classy"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("marks only the selected style as pressed", () => {
    render(<DotStyleSelector value="DOTS" onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Dots" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Square" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Rounded" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Classy" })).toHaveAttribute("aria-pressed", "false");
  });

  it("calls onChange with the clicked style", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DotStyleSelector value="SQUARE" onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Classy" }));

    expect(onChange).toHaveBeenCalledWith("CLASSY");
  });
});
