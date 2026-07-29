import { describe, it, expect, vi, beforeEach } from "vitest";
import type { QrFormValues } from "@/lib/qr-schema";

const revalidatePathMock = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

const getCurrentUserMock = vi.fn();
vi.mock("@/lib/current-user", () => ({
  getCurrentUser: getCurrentUserMock,
}));

const prismaMock = {
  qrCode: {
    create: vi.fn(),
    count: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    updateMany: vi.fn(),
    deleteMany: vi.fn(),
  },
};
vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

// Imported after the mocks above so the module under test picks them up.
const { createQrCode, listQrCodes, getQrCode, getPublicQrCode, updateQrCode, deleteQrCode } =
  await import("@/actions/qr-actions");

const CURRENT_USER = { id: "user_1", clerkId: "clerk_1", email: "user@example.com", name: null };

function makeFormInput(overrides: Partial<QrFormValues> = {}): QrFormValues {
  return {
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
    margin: 1,
    logoSize: 20,
    ...overrides,
  };
}

beforeEach(() => {
  revalidatePathMock.mockReset();
  getCurrentUserMock.mockReset();
  prismaMock.qrCode.create.mockReset();
  prismaMock.qrCode.count.mockReset();
  prismaMock.qrCode.findMany.mockReset();
  prismaMock.qrCode.findFirst.mockReset();
  prismaMock.qrCode.findUnique.mockReset();
  prismaMock.qrCode.updateMany.mockReset();
  prismaMock.qrCode.deleteMany.mockReset();
});

describe("createQrCode", () => {
  it("creates a QR code scoped to the current user and revalidates /saved", async () => {
    getCurrentUserMock.mockResolvedValue(CURRENT_USER);
    const created = { id: "qr_1" };
    prismaMock.qrCode.create.mockResolvedValue(created);

    const result = await createQrCode(makeFormInput());

    expect(prismaMock.qrCode.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user_1",
        type: "URL",
        data: "https://example.com",
        logoDataUrl: null,
      }),
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/saved");
    expect(result).toBe(created);
  });

  it("passes through a provided logoDataUrl instead of defaulting to null", async () => {
    getCurrentUserMock.mockResolvedValue(CURRENT_USER);
    prismaMock.qrCode.create.mockResolvedValue({ id: "qr_1" });

    await createQrCode(makeFormInput({ logoDataUrl: "data:image/png;base64,abc" }));

    expect(prismaMock.qrCode.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ logoDataUrl: "data:image/png;base64,abc" }),
    });
  });

  it("rejects invalid input before checking auth or touching the database", async () => {
    await expect(createQrCode({ ...makeFormInput(), fgColor: "not-a-color" })).rejects.toThrow();

    expect(getCurrentUserMock).not.toHaveBeenCalled();
    expect(prismaMock.qrCode.create).not.toHaveBeenCalled();
  });

  it("propagates an unauthorized error without creating a row", async () => {
    getCurrentUserMock.mockRejectedValue(new Error("Unauthorized"));

    await expect(createQrCode(makeFormInput())).rejects.toThrow("Unauthorized");
    expect(prismaMock.qrCode.create).not.toHaveBeenCalled();
  });
});

describe("listQrCodes", () => {
  it("returns paginated items scoped to the current user", async () => {
    getCurrentUserMock.mockResolvedValue(CURRENT_USER);
    prismaMock.qrCode.count.mockResolvedValue(25);
    const items = [{ id: "qr_1" }, { id: "qr_2" }];
    prismaMock.qrCode.findMany.mockResolvedValue(items);

    const result = await listQrCodes(2, 10);

    expect(prismaMock.qrCode.count).toHaveBeenCalledWith({ where: { userId: "user_1" } });
    expect(prismaMock.qrCode.findMany).toHaveBeenCalledWith({
      where: { userId: "user_1" },
      orderBy: { createdAt: "desc" },
      skip: 10,
      take: 10,
    });
    expect(result).toEqual({ items, totalCount: 25, totalPages: 3, page: 2 });
  });

  it("clamps a page number beyond the last page down to the last page", async () => {
    getCurrentUserMock.mockResolvedValue(CURRENT_USER);
    prismaMock.qrCode.count.mockResolvedValue(15);
    prismaMock.qrCode.findMany.mockResolvedValue([]);

    const result = await listQrCodes(99, 10);

    expect(prismaMock.qrCode.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    );
    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(2);
  });

  it("clamps a page number below 1 up to page 1", async () => {
    getCurrentUserMock.mockResolvedValue(CURRENT_USER);
    prismaMock.qrCode.count.mockResolvedValue(5);
    prismaMock.qrCode.findMany.mockResolvedValue([]);

    const result = await listQrCodes(0, 10);

    expect(prismaMock.qrCode.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 10 }),
    );
    expect(result.page).toBe(1);
  });

  it("returns totalPages of 1 and page 1 when there are no saved codes", async () => {
    getCurrentUserMock.mockResolvedValue(CURRENT_USER);
    prismaMock.qrCode.count.mockResolvedValue(0);
    prismaMock.qrCode.findMany.mockResolvedValue([]);

    const result = await listQrCodes(1, 10);

    expect(result).toEqual({ items: [], totalCount: 0, totalPages: 1, page: 1 });
  });

  it("propagates an unauthorized error without querying the database", async () => {
    getCurrentUserMock.mockRejectedValue(new Error("Unauthorized"));

    await expect(listQrCodes(1, 10)).rejects.toThrow("Unauthorized");
    expect(prismaMock.qrCode.count).not.toHaveBeenCalled();
    expect(prismaMock.qrCode.findMany).not.toHaveBeenCalled();
  });
});

describe("getQrCode", () => {
  it("looks up a QR code scoped to the current user", async () => {
    getCurrentUserMock.mockResolvedValue(CURRENT_USER);
    const qr = { id: "qr_1", userId: "user_1" };
    prismaMock.qrCode.findFirst.mockResolvedValue(qr);

    const result = await getQrCode("qr_1");

    expect(prismaMock.qrCode.findFirst).toHaveBeenCalledWith({
      where: { id: "qr_1", userId: "user_1" },
    });
    expect(result).toBe(qr);
  });

  it("returns null when the code doesn't exist or belongs to another user", async () => {
    getCurrentUserMock.mockResolvedValue(CURRENT_USER);
    prismaMock.qrCode.findFirst.mockResolvedValue(null);

    const result = await getQrCode("someone_elses_qr");

    expect(result).toBeNull();
  });

  it("propagates an unauthorized error without querying the database", async () => {
    getCurrentUserMock.mockRejectedValue(new Error("Unauthorized"));

    await expect(getQrCode("qr_1")).rejects.toThrow("Unauthorized");
    expect(prismaMock.qrCode.findFirst).not.toHaveBeenCalled();
  });
});

describe("getPublicQrCode", () => {
  it("looks up a QR code by id without requiring auth", async () => {
    const qr = { id: "qr_1", name: "My QR" };
    prismaMock.qrCode.findUnique.mockResolvedValue(qr);

    const result = await getPublicQrCode("qr_1");

    expect(getCurrentUserMock).not.toHaveBeenCalled();
    expect(result).toBe(qr);
  });

  it("selects only the fields the public share page renders, excluding userId and timestamps", async () => {
    prismaMock.qrCode.findUnique.mockResolvedValue(null);

    await getPublicQrCode("qr_1");

    const call = prismaMock.qrCode.findUnique.mock.calls[0][0];
    expect(call.where).toEqual({ id: "qr_1" });
    expect(call.select).toEqual(
      expect.objectContaining({
        id: true,
        name: true,
        type: true,
        data: true,
        fgColor: true,
        bgColor: true,
        size: true,
        level: true,
        dotStyle: true,
        finderFrameStyle: true,
        finderMarkerStyle: true,
        margin: true,
        logoDataUrl: true,
        logoSize: true,
      }),
    );
    expect(call.select).not.toHaveProperty("userId");
    expect(call.select).not.toHaveProperty("createdAt");
    expect(call.select).not.toHaveProperty("updatedAt");
  });

  it("returns null when no code matches the id", async () => {
    prismaMock.qrCode.findUnique.mockResolvedValue(null);

    const result = await getPublicQrCode("missing_id");

    expect(result).toBeNull();
  });
});

describe("updateQrCode", () => {
  it("updates a QR code scoped to the current user and revalidates /saved", async () => {
    getCurrentUserMock.mockResolvedValue(CURRENT_USER);
    prismaMock.qrCode.updateMany.mockResolvedValue({ count: 1 });

    await updateQrCode("qr_1", makeFormInput({ name: "Renamed" }));

    expect(prismaMock.qrCode.updateMany).toHaveBeenCalledWith({
      where: { id: "qr_1", userId: "user_1" },
      data: expect.objectContaining({ name: "Renamed", logoDataUrl: null }),
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/saved");
  });

  it("throws Not found when the row doesn't exist or belongs to another user", async () => {
    getCurrentUserMock.mockResolvedValue(CURRENT_USER);
    prismaMock.qrCode.updateMany.mockResolvedValue({ count: 0 });

    await expect(updateQrCode("someone_elses_qr", makeFormInput())).rejects.toThrow("Not found");
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("rejects invalid input before checking auth or touching the database", async () => {
    await expect(
      updateQrCode("qr_1", { ...makeFormInput(), size: 1 /* below the min of 128 */ }),
    ).rejects.toThrow();

    expect(getCurrentUserMock).not.toHaveBeenCalled();
    expect(prismaMock.qrCode.updateMany).not.toHaveBeenCalled();
  });

  it("propagates an unauthorized error without updating the database", async () => {
    getCurrentUserMock.mockRejectedValue(new Error("Unauthorized"));

    await expect(updateQrCode("qr_1", makeFormInput())).rejects.toThrow("Unauthorized");
    expect(prismaMock.qrCode.updateMany).not.toHaveBeenCalled();
  });
});

describe("deleteQrCode", () => {
  it("deletes a QR code scoped to the current user and revalidates /saved", async () => {
    getCurrentUserMock.mockResolvedValue(CURRENT_USER);
    prismaMock.qrCode.deleteMany.mockResolvedValue({ count: 1 });

    await deleteQrCode("qr_1");

    expect(prismaMock.qrCode.deleteMany).toHaveBeenCalledWith({
      where: { id: "qr_1", userId: "user_1" },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/saved");
  });

  it("revalidates even when no row matched (already deleted or not owned)", async () => {
    getCurrentUserMock.mockResolvedValue(CURRENT_USER);
    prismaMock.qrCode.deleteMany.mockResolvedValue({ count: 0 });

    await expect(deleteQrCode("someone_elses_qr")).resolves.toBeUndefined();
    expect(revalidatePathMock).toHaveBeenCalledWith("/saved");
  });

  it("propagates an unauthorized error without deleting anything", async () => {
    getCurrentUserMock.mockRejectedValue(new Error("Unauthorized"));

    await expect(deleteQrCode("qr_1")).rejects.toThrow("Unauthorized");
    expect(prismaMock.qrCode.deleteMany).not.toHaveBeenCalled();
  });
});
