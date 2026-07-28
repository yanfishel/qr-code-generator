"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { QrCode } from "@prisma/client";

import { SavedQrCard } from "@/components/qr/SavedQrCard";
import { deleteQrCode } from "@/actions/qr-actions";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type SavedQrListProps = {
  initialItems: QrCode[];
  isEmpty: boolean;
  page: number;
  totalPages: number;
};

export function SavedQrList({ initialItems, isEmpty, page, totalPages }: SavedQrListProps) {
  const [items, setItems] = useState(initialItems);
  const [, startDeleting] = useTransition();

  function handleDelete(id: string) {
    const previous = items;
    setItems((current) => current.filter((item) => item.id !== id));
    startDeleting(async () => {
      try {
        await deleteQrCode(id);
      } catch {
        setItems(previous);
        toast.error("Could not delete the QR code");
      }
    });
  }

  if (isEmpty) {
    return (
      <p className="text-muted-foreground">
        Nothing saved yet —{" "}
        <Link href="/" className="text-primary underline-offset-4 hover:underline">
          generate a code
        </Link>{" "}
        and hit Save to see it here.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {items.map((item) => (
          <SavedQrCard key={item.id} qrCode={item} onDelete={handleDelete} />
        ))}
      </div>
      {totalPages > 1 ? (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={`/saved?page=${Math.max(page - 1, 1)}`}
                aria-disabled={page === 1}
                className={page === 1 ? "pointer-events-none opacity-50" : undefined}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((n) => (
              <PaginationItem key={n}>
                <PaginationLink href={`/saved?page=${n}`} isActive={n === page}>
                  {n}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href={`/saved?page=${Math.min(page + 1, totalPages)}`}
                aria-disabled={page === totalPages}
                className={page === totalPages ? "pointer-events-none opacity-50" : undefined}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </div>
  );
}
