import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { QrCode } from "@prisma/client";

const downloadMock = vi.fn();
vi.mock("@/hooks/use-qr-download", () => ({
  useQrDownload: () => downloadMock,
}));

vi.mock("qrcode.react", () => ({
  QRCodeCanvas: ({
    ref,
    value,
    size,
    fgColor,
    bgColor,
    level,
    imageSettings,
  }: {
    ref?: React.Ref<HTMLCanvasElement>;
    value: string;
    size: number;
    fgColor: string;
    bgColor: string;
    level: string;
    imageSettings?: { src: string };
  }) => (
    <canvas
      ref={ref}
      data-testid="qr-canvas"
      data-value={value}
      data-size={size}
      data-fg-color={fgColor}
      data-bg-color={bgColor}
      data-level={level}
      data-logo={imageSettings?.src ?? ""}
    />
  ),
}));

const { SavedQrCard } = await import("@/components/qr/SavedQrCard");

function makeQrCode(overrides: Partial<QrCode> = {}): QrCode {
  return {
    id: "qr_1",
    userId: "user_1",
    name: "My QR",
    type: "URL",
    data: "https://example.com",
    fgColor: "#111111",
    bgColor: "#eeeeee",
    size: 256,
    level: "M",
    margin: 2,
    logoDataUrl: null,
    logoSize: 20,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("SavedQrCard", () => {
  beforeEach(() => {
    downloadMock.mockReset();
  });

  it("renders the QR canvas with the code's data and styling", () => {
    const qrCode = makeQrCode();
    render(<SavedQrCard qrCode={qrCode} onDelete={vi.fn()} />);

    const canvas = screen.getByTestId("qr-canvas");
    expect(canvas).toHaveAttribute("data-value", "https://example.com");
    expect(canvas).toHaveAttribute("data-size", "200");
    expect(canvas).toHaveAttribute("data-fg-color", "#111111");
    expect(canvas).toHaveAttribute("data-bg-color", "#eeeeee");
    expect(canvas).toHaveAttribute("data-level", "M");
  });

  it("omits imageSettings when there is no logo", () => {
    render(<SavedQrCard qrCode={makeQrCode({ logoDataUrl: null })} onDelete={vi.fn()} />);

    expect(screen.getByTestId("qr-canvas")).toHaveAttribute("data-logo", "");
  });

  it("passes the logo through to imageSettings when present", () => {
    render(
      <SavedQrCard
        qrCode={makeQrCode({ logoDataUrl: "data:image/png;base64,abc" })}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByTestId("qr-canvas")).toHaveAttribute("data-logo", "data:image/png;base64,abc");
  });

  it("displays the saved name when present", () => {
    render(<SavedQrCard qrCode={makeQrCode({ name: "Business card" })} onDelete={vi.fn()} />);

    expect(screen.getByText("Business card")).toBeInTheDocument();
  });

  it("falls back to the raw data as the label when there is no name", () => {
    render(
      <SavedQrCard
        qrCode={makeQrCode({ name: null, data: "https://fallback.example" })}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("https://fallback.example")).toBeInTheDocument();
  });

  it("downloads using the saved name when present", async () => {
    const user = userEvent.setup();
    render(<SavedQrCard qrCode={makeQrCode({ id: "qr_1", name: "Business card" })} onDelete={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /download/i }));

    expect(downloadMock).toHaveBeenCalledTimes(1);
    const [canvasArg, filenameArg] = downloadMock.mock.calls[0];
    expect(canvasArg).toBeInstanceOf(HTMLCanvasElement);
    expect(filenameArg).toBe("Business card");
  });

  it("falls back to the id as the download filename when there is no name", async () => {
    const user = userEvent.setup();
    render(<SavedQrCard qrCode={makeQrCode({ id: "qr_42", name: null })} onDelete={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /download/i }));

    expect(downloadMock).toHaveBeenCalledWith(expect.any(HTMLCanvasElement), "qr_42");
  });

  it("asks for confirmation before deleting and does not delete on cancel", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<SavedQrCard qrCode={makeQrCode()} onDelete={onDelete} />);

    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(await screen.findByText("Delete this QR code?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onDelete).not.toHaveBeenCalled();
  });

  it("calls onDelete with the code's id when the deletion is confirmed", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<SavedQrCard qrCode={makeQrCode({ id: "qr_99" })} onDelete={onDelete} />);

    await user.click(screen.getByRole("button", { name: "Delete" }));
    const confirmButtons = await screen.findAllByRole("button", { name: "Delete" });
    await user.click(confirmButtons[confirmButtons.length - 1]);

    expect(onDelete).toHaveBeenCalledWith("qr_99");
  });
});
