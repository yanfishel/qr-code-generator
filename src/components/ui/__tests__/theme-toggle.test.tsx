import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";

const useThemeMock = vi.fn();
vi.mock("next-themes", () => ({
  useTheme: () => useThemeMock(),
}));

// Hoisted mock utilities for use in individual tests
const { useEffectStub } = vi.hoisted(() => {
  let isStubbed = false;
  return {
    useEffectStub: {
      enable: () => {
        isStubbed = true;
      },
      disable: () => {
        isStubbed = false;
      },
      isActive: () => isStubbed,
    },
  };
});

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof React>("react");
  return {
    ...actual,
    useEffect: ((fn, deps) => {
      // Only call the effect if not stubbed
      if (!useEffectStub.isActive()) {
        return actual.useEffect(fn, deps);
      }
    }) as typeof React.useEffect,
  };
});

const { ThemeToggle } = await import("@/components/ui/theme-toggle");

describe("ThemeToggle", () => {
  const setThemeMock = vi.fn();

  beforeEach(() => {
    setThemeMock.mockReset();
    useThemeMock.mockReturnValue({ theme: "light", setTheme: setThemeMock });
  });

  it("renders a Sun icon on the trigger when the theme is light", () => {
    const { container } = render(<ThemeToggle />);

    expect(screen.getByRole("button", { name: "Change theme" })).toBeInTheDocument();
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

    await user.click(screen.getByRole("button", { name: "Change theme" }));

    expect(await screen.findByRole("menuitemradio", { name: /^Light/ })).toBeInTheDocument();
    expect(screen.getByRole("menuitemradio", { name: /^Dark/ })).toBeInTheDocument();
    expect(screen.getByRole("menuitemradio", { name: /^System/ })).toBeInTheDocument();
  });

  it("shows a check mark next to the currently active option", async () => {
    useThemeMock.mockReturnValue({ theme: "dark", setTheme: setThemeMock });
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole("button", { name: "Change theme" }));

    const darkItem = await screen.findByRole("menuitemradio", { name: /^Dark/ });
    expect(darkItem).toHaveAttribute("aria-checked", "true");
    expect(darkItem.querySelector(".lucide-check")).toBeInTheDocument();
    const lightItem = screen.getByRole("menuitemradio", { name: /^Light/ });
    expect(lightItem).toHaveAttribute("aria-checked", "false");
    expect(lightItem.querySelector(".lucide-check")).not.toBeInTheDocument();
  });

  it("calls setTheme with the selected option's value", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole("button", { name: "Change theme" }));
    await user.click(await screen.findByRole("menuitemradio", { name: /^Dark/ }));

    expect(setThemeMock).toHaveBeenCalledWith("dark");
  });

  it("calls setTheme with 'system' when System is selected", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole("button", { name: "Change theme" }));
    await user.click(await screen.findByRole("menuitemradio", { name: /^System/ }));

    expect(setThemeMock).toHaveBeenCalledWith("system");
  });

  it("keeps the Monitor fallback if the mount effect has not run yet, even when the theme is already resolved", () => {
    // The mount guard prevents hydration mismatches by rendering Monitor on the server
    // (mounted=false) even when next-themes has already resolved the theme via localStorage.
    // This test verifies the pre-mount gate: if the mount effect hasn't fired, the component
    // must show Monitor regardless of the actual theme value, matching the server render.
    //
    // Without the mount guard, theme="dark" would render Moon immediately (hydration mismatch).
    // With the guard, mounted=false forces Monitor until the effect runs (no mismatch).

    useEffectStub.enable();
    useThemeMock.mockReturnValue({ theme: "dark", setTheme: setThemeMock });

    const { container } = render(<ThemeToggle />);

    // Even though the theme is already "dark" (resolved by next-themes during hydration),
    // the component should still render Monitor because mounted=false (effect never ran)
    expect(container.querySelector(".lucide-monitor")).toBeInTheDocument();
    expect(container.querySelector(".lucide-moon")).not.toBeInTheDocument();

    useEffectStub.disable();
  });
});
