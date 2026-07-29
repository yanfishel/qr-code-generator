import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { QrCode } from "@prisma/client";

const downloadMock = vi.fn();
vi.mock("@/hooks/use-qr-download", () => ({
  useQrDownload: () => downloadMock,
}));

vi.mock("@/components/qr/QrCanvas", () => ({
  QrCanvas: ({
    ref,
    value,
    size,
  }: {
    ref?: React.Ref<HTMLCanvasElement>;
    value: string;
    size: number;
  }) => <canvas ref={ref} data-testid="qr-canvas" data-value={value} data-size={size} />,
}));

vi.mock("@/components/qr/QrSvg", () => ({
  QrSvg: ({ ref, value }: { ref?: React.Ref<SVGSVGElement>; value: string }) => (
    <svg ref={ref} data-testid="qr-svg" data-value={value} />
  ),
}));

const { PublicQrView } = await import("@/components/qr/PublicQrView");

function makeQrCode(overrides: Partial<QrCode> = {}): QrCode {
  return {
    id: "qr_1",
    userId: "user_1",
    name: "My QR",
    type: "URL",
    data: "https://example.com",
    fgColor: "#111111",
    bgColor: "#eeeeee",
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

describe("PublicQrView", () => {
  beforeEach(() => {
    downloadMock.mockReset();
  });

  it("renders the QR canvas at the code's own persisted size", () => {
    render(<PublicQrView qrCode={makeQrCode({ size: 512 })} />);

    expect(screen.getByTestId("qr-canvas")).toHaveAttribute("data-size", "512");
  });

  it("renders the QR canvas with the code's value", () => {
    render(<PublicQrView qrCode={makeQrCode({ data: "https://example.com" })} />);

    expect(screen.getByTestId("qr-canvas")).toHaveAttribute("data-value", "https://example.com");
  });

  it("downloads the PNG using the canvas ref and the saved name", async () => {
    const user = userEvent.setup();
    render(<PublicQrView qrCode={makeQrCode({ name: "Business card" })} />);

    await user.click(screen.getByRole("button", { name: "PNG" }));

    expect(downloadMock).toHaveBeenCalledTimes(1);
    const [canvasArg, filenameArg] = downloadMock.mock.calls[0];
    expect(canvasArg).toBeInstanceOf(HTMLCanvasElement);
    expect(filenameArg).toBe("Business card");
  });

  it("downloads the SVG using the svg ref and the saved name", async () => {
    const user = userEvent.setup();
    render(<PublicQrView qrCode={makeQrCode({ name: "Business card" })} />);

    await user.click(screen.getByRole("button", { name: "SVG" }));

    expect(downloadMock).toHaveBeenCalledTimes(1);
    const [svgArg, filenameArg] = downloadMock.mock.calls[0];
    expect(svgArg.tagName.toLowerCase()).toBe("svg");
    expect(filenameArg).toBe("Business card");
  });

  it("falls back to the id as the download filename when there is no name", async () => {
    const user = userEvent.setup();
    render(<PublicQrView qrCode={makeQrCode({ id: "qr_42", name: null })} />);

    await user.click(screen.getByRole("button", { name: "PNG" }));

    expect(downloadMock).toHaveBeenCalledWith(expect.any(HTMLCanvasElement), "qr_42");
  });
});
