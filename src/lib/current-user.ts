import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const existing = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (existing) return existing;

  const clerkUser = await currentUser();
  const email = clerkUser?.primaryEmailAddress?.emailAddress ?? clerkUser?.emailAddresses[0]?.emailAddress;
  if (!email) throw new Error("Signed-in Clerk user has no email address");

  return prisma.user.create({
    data: {
      clerkId: userId,
      email,
      name: clerkUser?.fullName ?? undefined,
    },
  });
}
