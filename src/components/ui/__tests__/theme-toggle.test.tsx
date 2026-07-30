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
