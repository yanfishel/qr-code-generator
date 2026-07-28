import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { QrCode } from "@prisma/client";

const authProtectMock = vi.fn();
vi.mock("@clerk/nextjs/server", () => ({
  auth: {
    protect: authProtectMock,
  },
}));

const listQrCodesMock = vi.fn();
vi.mock("@/actions/qr-actions", () => ({
  listQrCodes: listQrCodesMock,
}));

vi.mock("@/components/qr/SavedQrList", () => ({
  SavedQrList: ({ initialItems }: { initialItems: QrCode[] }) => (
    <div data-testid="saved-qr-list">{JSON.stringify(initialItems)}</div>
  ),
}));

// Imported after the mocks above so the module under test picks them up.
const { default: SavedPage } = await import("@/app/saved/page");

function makeQrCode(overrides: Partial<QrCode> = {}): QrCode {
  return {
    id: "qr_1",
    userId: "user_1",
    name: "My QR",
    type: "URL",
    data: "https://example.com",
    fgColor: "#000000",
    bgColor: "#FFFFFF",
    size: 256,
    level: "M",
    dotStyle: "SQUARE",
    finderFrameStyle: "SQUARE",
    finderMarkerStyle: "SQUARE",
    margin: 2,
    logoDataUrl: null,
    logoSize: 20,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("SavedPage", () => {
  beforeEach(() => {
    authProtectMock.mockReset();
    listQrCodesMock.mockReset();
  });

  it("protects the route before loading data", async () => {
    const callOrder: string[] = [];
    authProtectMock.mockImplementation(async () => {
      callOrder.push("protect");
    });
    listQrCodesMock.mockImplementation(async () => {
      callOrder.push("list");
      return [];
    });

    await SavedPage();

    expect(callOrder).toEqual(["protect", "list"]);
  });

  it("renders the page heading and description", async () => {
    authProtectMock.mockResolvedValue(undefined);
    listQrCodesMock.mockResolvedValue([]);

    const ui = await SavedPage();
    render(ui);

    expect(screen.getByText("Saved codes")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Saved", level: 1 })).toBeInTheDocument();
    expect(
      screen.getByText("Every QR code you've saved, ready to download again."),
    ).toBeInTheDocument();
  });

  it("breadcrumbs back to the generator", async () => {
    authProtectMock.mockResolvedValue(undefined);
    listQrCodesMock.mockResolvedValue([]);

    const ui = await SavedPage();
    render(ui);

    expect(screen.getByRole("link", { name: "Generator" })).toHaveAttribute("href", "/");
  });

  it("passes the loaded QR codes through to SavedQrList", async () => {
    const qrCodes = [makeQrCode({ id: "qr_1" }), makeQrCode({ id: "qr_2", name: "Second" })];
    authProtectMock.mockResolvedValue(undefined);
    listQrCodesMock.mockResolvedValue(qrCodes);

    const ui = await SavedPage();
    render(ui);

    const list = screen.getByTestId("saved-qr-list");
    const rendered = JSON.parse(list.textContent ?? "[]");
    expect(rendered).toHaveLength(2);
    expect(rendered[0].id).toBe("qr_1");
    expect(rendered[1].id).toBe("qr_2");
  });

  it("renders SavedQrList with an empty array when the user has no saved codes", async () => {
    authProtectMock.mockResolvedValue(undefined);
    listQrCodesMock.mockResolvedValue([]);

    const ui = await SavedPage();
    render(ui);

    const list = screen.getByTestId("saved-qr-list");
    expect(JSON.parse(list.textContent ?? "null")).toEqual([]);
  });

  it("propagates the redirect when the visitor is signed out", async () => {
    const redirectError = new Error("NEXT_REDIRECT");
    authProtectMock.mockRejectedValue(redirectError);
    listQrCodesMock.mockResolvedValue([]);

    await expect(SavedPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(listQrCodesMock).not.toHaveBeenCalled();
  });

  it("propagates errors thrown while loading QR codes", async () => {
    authProtectMock.mockResolvedValue(undefined);
    listQrCodesMock.mockRejectedValue(new Error("Database unavailable"));

    await expect(SavedPage()).rejects.toThrow("Database unavailable");
  });
});
