"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { qrFormSchema } from "@/lib/qr-schema";

export async function createQrCode(input: unknown) {
  const parsed = qrFormSchema.parse(input);
  const user = await getCurrentUser();
  const qr = await prisma.qrCode.create({
    data: { userId: user.id, ...parsed, logoDataUrl: parsed.logoDataUrl ?? null },
  });
  revalidatePath("/saved");
  return qr;
}

export async function listQrCodes(page: number, pageSize: number) {
  const user = await getCurrentUser();
  const totalCount = await prisma.qrCode.count({ where: { userId: user.id } });
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  // Clamp before querying so a stale/out-of-range ?page= (e.g. after the
  // last item on the last page was deleted) still resolves to real rows
  // instead of an empty page.
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const items = await prisma.qrCode.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
  });
  return { items, totalCount, totalPages, page: currentPage };
}

export async function getQrCode(id: string) {
  const user = await getCurrentUser();
  return prisma.qrCode.findFirst({ where: { id, userId: user.id } });
}

export async function getPublicQrCode(id: string) {
  return prisma.qrCode.findUnique({ where: { id } });
}

export async function updateQrCode(id: string, input: unknown) {
  const parsed = qrFormSchema.parse(input);
  const user = await getCurrentUser();
  // updateMany with a userId guard (not update({where:{id}})) enforces
  // ownership, same reasoning as deleteQrCode below.
  const { count } = await prisma.qrCode.updateMany({
    where: { id, userId: user.id },
    data: { ...parsed, logoDataUrl: parsed.logoDataUrl ?? null },
  });
  if (count === 0) throw new Error("Not found");
  revalidatePath("/saved");
}

export async function deleteQrCode(id: string) {
  const user = await getCurrentUser();
  // deleteMany with a userId guard (not delete({where:{id}})) enforces
  // ownership — stays correct once Clerk introduces multiple real users.
  await prisma.qrCode.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/saved");
}
