// TODO(clerk): Replace with a real session lookup once Clerk is wired up —
// import auth() from "@clerk/nextjs/server", read auth().userId, and use
// that instead of DEFAULT_USER_CLERK_ID (upserting a User row on first
// sign-in). Until then the whole app runs in single-user mode.
import { prisma } from "@/lib/prisma";

export const DEFAULT_USER_CLERK_ID = "seed-default-user";

export async function getCurrentUser() {
  return prisma.user.findUniqueOrThrow({
    where: { clerkId: DEFAULT_USER_CLERK_ID },
  });
}
