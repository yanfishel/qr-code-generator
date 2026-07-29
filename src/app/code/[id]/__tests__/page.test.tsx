import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { QrCode } from "@prisma/client";

const getPublicQrCodeMock = vi.fn();
vi.mock("@/actions/qr-actions", () => ({
  getPublicQrCode: getPublicQrCodeMock,
}));

const notFoundMock = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
}));

vi.mock("@/components/qr/PublicQrView", () => ({
  PublicQrView: ({ qrCode }: { qrCode: QrCode }) => (
    <div data-testid="public-qr-view" data-id={qrCode.id} />
  ),
}));

const { default: PublicQrCodePage } = await import("@/app/code/[id]/page");

function makeQrCode(overrides: Partial<QrCode> = {}): QrCode {
  return {
    id: "qr_1",
    userId: "user_1",
    name: "My QR",
    type: "URL",
    data: "https://example.com",
    fgColor: "#000000",
    bgColor: "#FFFFFF",
    size: 512,
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

function renderPage(id = "qr_1") {
  return PublicQrCodePage({ params: Promise.resolve({ id }) });
}

describe("PublicQrCodePage", () => {
  beforeEach(() => {
    getPublicQrCodeMock.mockReset();
    notFoundMock.mockClear();
  });

  it("renders the QR name as the heading", async () => {
    getPublicQrCodeMock.mockResolvedValue(makeQrCode({ name: "Business card" }));

    const ui = await renderPage();
    render(ui);

    expect(screen.getByRole("heading", { name: "Business card", level: 1 })).toBeInTheDocument();
  });

  it("falls back to the type label when the code has no name", async () => {
    getPublicQrCodeMock.mockResolvedValue(makeQrCode({ name: null, type: "WIFI" }));

    const ui = await renderPage();
    render(ui);

    expect(screen.getByRole("heading", { name: "Wi-Fi", level: 1 })).toBeInTheDocument();
  });

  it("passes the loaded QR code through to PublicQrView", async () => {
    getPublicQrCodeMock.mockResolvedValue(makeQrCode({ id: "qr_7" }));

    const ui = await renderPage("qr_7");
    render(ui);

    expect(screen.getByTestId("public-qr-view")).toHaveAttribute("data-id", "qr_7");
  });

  it("looks up the QR code by the id from the route params", async () => {
    getPublicQrCodeMock.mockResolvedValue(makeQrCode());

    await renderPage("qr_123");

    expect(getPublicQrCodeMock).toHaveBeenCalledWith("qr_123");
  });

  it("calls notFound when no QR code matches the id", async () => {
    getPublicQrCodeMock.mockResolvedValue(null);

    await expect(renderPage()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalled();
  });
});
