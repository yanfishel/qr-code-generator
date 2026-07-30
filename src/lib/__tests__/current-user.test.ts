import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";

const authMock = vi.fn();
const currentUserMock = vi.fn();
vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
  currentUser: currentUserMock,
}));

const prismaMock = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
};
vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

const { getCurrentUser } = await import("@/lib/current-user");

const CLERK_ID = "clerk_1";
const EMAIL = "user@example.com";
const CLERK_USER = {
  primaryEmailAddress: { emailAddress: EMAIL },
  emailAddresses: [{ emailAddress: EMAIL }],
  fullName: "Test User",
};

function uniqueConstraintError(target: string) {
  return new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "test",
    meta: { target: [target] },
  });
}

beforeEach(() => {
  authMock.mockReset();
  currentUserMock.mockReset();
  prismaMock.user.findUnique.mockReset();
  prismaMock.user.create.mockReset();
  prismaMock.user.update.mockReset();
  authMock.mockResolvedValue({ userId: CLERK_ID });
  currentUserMock.mockResolvedValue(CLERK_USER);
});

describe("getCurrentUser", () => {
  it("throws Unauthorized when signed out", async () => {
    authMock.mockResolvedValue({ userId: null });

    await expect(getCurrentUser()).rejects.toThrow("Unauthorized");
  });

  it("returns the existing row when found by clerkId", async () => {
    const existing = { id: "user_1", clerkId: CLERK_ID, email: EMAIL };
    prismaMock.user.findUnique.mockResolvedValue(existing);

    await expect(getCurrentUser()).resolves.toBe(existing);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("creates a new row when none exists", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const created = { id: "user_1", clerkId: CLERK_ID, email: EMAIL };
    prismaMock.user.create.mockResolvedValue(created);

    await expect(getCurrentUser()).resolves.toBe(created);
    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: { clerkId: CLERK_ID, email: EMAIL, name: "Test User" },
    });
  });

  it("re-fetches by clerkId when create races on clerkId", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    prismaMock.user.create.mockRejectedValue(uniqueConstraintError("User_clerkId_key"));
    const raceWinner = { id: "user_1", clerkId: CLERK_ID, email: EMAIL };
    prismaMock.user.findUnique.mockResolvedValueOnce(raceWinner);

    await expect(getCurrentUser()).resolves.toBe(raceWinner);
  });

  it("re-links an existing row by email when create collides on email", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockRejectedValue(uniqueConstraintError("User_email_key"));
    const relinked = { id: "user_1", clerkId: CLERK_ID, email: EMAIL };
    prismaMock.user.update.mockResolvedValue(relinked);

    await expect(getCurrentUser()).resolves.toBe(relinked);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { email: EMAIL },
      data: { clerkId: CLERK_ID, name: "Test User" },
    });
  });

  it("rethrows unrelated errors", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const otherError = new Error("boom");
    prismaMock.user.create.mockRejectedValue(otherError);

    await expect(getCurrentUser()).rejects.toBe(otherError);
  });
});
