import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const useUserMock = vi.fn();
const useClerkMock = vi.fn();
vi.mock("@clerk/nextjs", () => ({
  useUser: () => useUserMock(),
  useClerk: () => useClerkMock(),
}));

const { UserMenu } = await import("@/components/qr/UserMenu");

describe("UserMenu", () => {
  const openUserProfileMock = vi.fn();
  const signOutMock = vi.fn();

  beforeEach(() => {
    openUserProfileMock.mockReset();
    signOutMock.mockReset();
    useUserMock.mockReturnValue({
      user: {
        imageUrl: "https://example.com/avatar.png",
        fullName: "Yan Fishel",
        username: "yanfishel",
        primaryEmailAddress: { emailAddress: "yan.fishel@gmail.com" },
      },
    });
    useClerkMock.mockReturnValue({
      openUserProfile: openUserProfileMock,
      signOut: signOutMock,
    });
  });

  it("renders the trigger button with the user's avatar", () => {
    render(<UserMenu />);

    const trigger = screen.getByRole("button", { name: "Account menu" });
    const avatar = trigger.querySelector("img");
    expect(avatar).toHaveAttribute("src", "https://example.com/avatar.png");
  });

  it("shows the user's name and email in the dropdown header", async () => {
    const user = userEvent.setup();
    render(<UserMenu />);

    await user.click(screen.getByRole("button", { name: "Account menu" }));

    expect(await screen.findByText("Yan Fishel")).toBeInTheDocument();
    expect(screen.getByText("yan.fishel@gmail.com")).toBeInTheDocument();
  });

  it("calls openUserProfile when Manage Account is clicked", async () => {
    const user = userEvent.setup();
    render(<UserMenu />);

    await user.click(screen.getByRole("button", { name: "Account menu" }));
    await user.click(await screen.findByRole("menuitem", { name: /Manage Account/ }));

    expect(openUserProfileMock).toHaveBeenCalled();
  });

  it("calls signOut with a redirect to home when Sign Out is clicked", async () => {
    const user = userEvent.setup();
    render(<UserMenu />);

    await user.click(screen.getByRole("button", { name: "Account menu" }));
    await user.click(await screen.findByRole("menuitem", { name: /Sign Out/ }));

    expect(signOutMock).toHaveBeenCalledWith({ redirectUrl: "/" });
  });

  it("renders nothing when the user is not loaded", () => {
    useUserMock.mockReturnValue({ user: null });
    const { container } = render(<UserMenu />);

    expect(container).toBeEmptyDOMElement();
  });
});
