import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { listQrCodes } from "@/actions/qr-actions";
import { SavedQrList } from "@/components/qr/SavedQrList";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

type SavedPageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function SavedPage({ searchParams }: SavedPageProps) {
  await auth.protect();
  const { page: pageParam } = await searchParams;
  const requestedPage = Number(pageParam) || 1;
  const { items, totalCount, totalPages, page } = await listQrCodes(requestedPage, PAGE_SIZE);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 font-mono text-xs tracking-widest uppercase">
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            Generator
          </Link>
          <span aria-hidden="true" className="text-muted-foreground">
            /
          </span>
          <span className="text-primary">Saved codes</span>
        </nav>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Saved</h1>
        <p className="text-muted-foreground">Every QR code you&apos;ve saved, ready to download again.</p>
      </div>
      <SavedQrList
        key={page}
        initialItems={items}
        isEmpty={totalCount === 0}
        page={page}
        totalPages={totalPages}
      />
    </div>
  );
}
