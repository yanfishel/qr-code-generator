import { Prisma } from "@prisma/client";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

function isUniqueConstraintError(error: unknown, target: string) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    (error.meta?.target as string[] | undefined)?.includes(target)
  );
}

export async function getCurrentUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const existing = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (existing) return existing;

  const clerkUser = await currentUser();
  const email = clerkUser?.primaryEmailAddress?.emailAddress ?? clerkUser?.emailAddresses[0]?.emailAddress;
  if (!email) throw new Error("Signed-in Clerk user has no email address");

  try {
    return await prisma.user.create({
      data: {
        clerkId: userId,
        email,
        name: clerkUser?.fullName ?? undefined,
      },
    });
  } catch (error) {
    // Concurrent first sign-in (e.g. duplicate save retry) already created this clerkId.
    if (isUniqueConstraintError(error, "User_clerkId_key")) {
      const race = await prisma.user.findUnique({ where: { clerkId: userId } });
      if (race) return race;
    }

    // A row with this email already exists under a different clerkId (e.g. it was
    // created via a different Clerk instance, such as dev vs prod, for the same
    // person) — re-link it to the current clerkId instead of failing the save.
    if (isUniqueConstraintError(error, "User_email_key")) {
      return prisma.user.update({
        where: { email },
        data: { clerkId: userId, name: clerkUser?.fullName ?? undefined },
      });
    }

    throw error;
  }
}
