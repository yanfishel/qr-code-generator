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
    data: "https://example.com",
    fgColor: "#000000",
    bgColor: "#FFFFFF",
    size: 256,
    level: "M",
    logoDataUrl: null,
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
    render(<SavedQrList initialItems={[]} />);

    expect(screen.getByText(/nothing saved yet/i)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "generate a code" });
    expect(link).toHaveAttribute("href", "/");
  });

  it("renders a card for each saved QR code", () => {
    const items = [makeQrCode({ id: "qr_1", name: "First" }), makeQrCode({ id: "qr_2", name: "Second" })];
    render(<SavedQrList initialItems={items} />);

    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
    expect(screen.queryByText(/nothing saved yet/i)).not.toBeInTheDocument();
  });

  it("optimistically removes an item and calls deleteQrCode with its id", async () => {
    const user = userEvent.setup();
    deleteQrCodeMock.mockResolvedValue(undefined);
    const items = [makeQrCode({ id: "qr_1", name: "First" }), makeQrCode({ id: "qr_2", name: "Second" })];
    render(<SavedQrList initialItems={items} />);

    await user.click(screen.getByRole("button", { name: "Delete First" }));

    expect(screen.queryByText("First")).not.toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
    await waitFor(() => expect(deleteQrCodeMock).toHaveBeenCalledWith("qr_1"));
  });

  it("re-adds the item and shows an error toast when deletion fails", async () => {
    const user = userEvent.setup();
    deleteQrCodeMock.mockRejectedValue(new Error("network error"));
    const items = [makeQrCode({ id: "qr_1", name: "First" })];
    render(<SavedQrList initialItems={items} />);

    await user.click(screen.getByRole("button", { name: "Delete First" }));

    await waitFor(() => expect(screen.getByText("First")).toBeInTheDocument());
    expect(toastErrorMock).toHaveBeenCalledWith("Could not delete the QR code");
  });

  it("shows the empty state again once the last item is deleted", async () => {
    const user = userEvent.setup();
    deleteQrCodeMock.mockResolvedValue(undefined);
    render(<SavedQrList initialItems={[makeQrCode({ id: "qr_1", name: "Only" })]} />);

    await user.click(screen.getByRole("button", { name: "Delete Only" }));

    expect(await screen.findByText(/nothing saved yet/i)).toBeInTheDocument();
  });
});
