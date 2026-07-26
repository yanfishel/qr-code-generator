import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { DEFAULT_USER_CLERK_ID } from "../src/lib/current-user";

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { clerkId: DEFAULT_USER_CLERK_ID },
    update: {},
    create: {
      clerkId: DEFAULT_USER_CLERK_ID,
      email: "dev@example.com",
      name: "Default User",
    },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
