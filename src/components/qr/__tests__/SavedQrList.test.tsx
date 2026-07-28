import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { QrCode } from "@prisma/client";

const deleteQrCodeMock = vi.fn();
vi.mock("@/actions/qr-actions", () => ({
  deleteQrCode: deleteQrCodeMock,
}));

const toastErrorMock = vi.fn();
vi.mock("sonner", () => ({
  toast: { error: toastErrorMock },
}));

vi.mock("@/components/qr/SavedQrCard", () => ({
  SavedQrCard: ({
    qrCode,
    onDelete,
  }: {
    qrCode: QrCode;
    onDelete: (id: string) => void;
  }) => (
    <div>
      <span>{qrCode.name}</span>
      <button onClick={() => onDelete(qrCode.id)}>Delete {qrCode.name}</button>
    </div>
  ),
}));

const { SavedQrList } = await import("@/components/qr/SavedQrList");

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

describe("SavedQrList", () => {
  beforeEach(() => {
    deleteQrCodeMock.mockReset();
    toastErrorMock.mockReset();
  });

  it("shows an empty state with a link back to the generator when there is nothing saved", () => {
    render(<SavedQrList initialItems={[]} isEmpty page={1} totalPages={1} />);

    expect(screen.getByText(/nothing saved yet/i)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "generate a code" });
    expect(link).toHaveAttribute("href", "/");
  });

  it("renders a card for each saved QR code on the current page", () => {
    const items = [makeQrCode({ id: "qr_1", name: "First" }), makeQrCode({ id: "qr_2", name: "Second" })];
    render(<SavedQrList initialItems={items} isEmpty={false} page={1} totalPages={1} />);

    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
    expect(screen.queryByText(/nothing saved yet/i)).not.toBeInTheDocument();
  });

  it("optimistically removes an item and calls deleteQrCode with its id", async () => {
    const user = userEvent.setup();
    deleteQrCodeMock.mockResolvedValue(undefined);
    const items = [makeQrCode({ id: "qr_1", name: "First" }), makeQrCode({ id: "qr_2", name: "Second" })];
    render(<SavedQrList initialItems={items} isEmpty={false} page={1} totalPages={1} />);

    await user.click(screen.getByRole("button", { name: "Delete First" }));

    expect(screen.queryByText("First")).not.toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
    await waitFor(() => expect(deleteQrCodeMock).toHaveBeenCalledWith("qr_1"));
  });

  it("re-adds the item and shows an error toast when deletion fails", async () => {
    const user = userEvent.setup();
    deleteQrCodeMock.mockRejectedValue(new Error("network error"));
    const items = [makeQrCode({ id: "qr_1", name: "First" })];
    render(<SavedQrList initialItems={items} isEmpty={false} page={1} totalPages={1} />);

    await user.click(screen.getByRole("button", { name: "Delete First" }));

    await waitFor(() => expect(screen.getByText("First")).toBeInTheDocument());
    expect(toastErrorMock).toHaveBeenCalledWith("Could not delete the QR code");
  });

  describe("pagination", () => {
    it("does not show pagination controls when there is only one page", () => {
      render(
        <SavedQrList
          initialItems={[makeQrCode({ id: "qr_1", name: "First" })]}
          isEmpty={false}
          page={1}
          totalPages={1}
        />,
      );

      expect(screen.queryByRole("navigation", { name: "pagination" })).not.toBeInTheDocument();
    });

    it("links each page number to /saved?page=N and marks the current page active", () => {
      render(
        <SavedQrList
          initialItems={[makeQrCode({ id: "qr_1", name: "First" })]}
          isEmpty={false}
          page={2}
          totalPages={3}
        />,
      );

      expect(screen.getByRole("link", { name: "1" })).toHaveAttribute("href", "/saved?page=1");
      const current = screen.getByRole("link", { name: "2" });
      expect(current).toHaveAttribute("href", "/saved?page=2");
      expect(current).toHaveAttribute("aria-current", "page");
      expect(screen.getByRole("link", { name: "3" })).toHaveAttribute("href", "/saved?page=3");
    });

    it("disables Previous on the first page and Next on the last page", () => {
      const { rerender } = render(
        <SavedQrList
          initialItems={[makeQrCode({ id: "qr_1", name: "First" })]}
          isEmpty={false}
          page={1}
          totalPages={2}
        />,
      );

      expect(screen.getByRole("link", { name: /go to previous page/i })).toHaveAttribute(
        "aria-disabled",
        "true",
      );
      expect(screen.getByRole("link", { name: /go to next page/i })).not.toHaveAttribute(
        "aria-disabled",
        "true",
      );

      rerender(
        <SavedQrList
          initialItems={[makeQrCode({ id: "qr_1", name: "First" })]}
          isEmpty={false}
          page={2}
          totalPages={2}
        />,
      );

      expect(screen.getByRole("link", { name: /go to next page/i })).toHaveAttribute(
        "aria-disabled",
        "true",
      );
    });
  });
});
