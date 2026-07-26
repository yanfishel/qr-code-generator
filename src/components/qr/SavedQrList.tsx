"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { QrCode } from "@prisma/client";

import { SavedQrCard } from "@/components/qr/SavedQrCard";
import { deleteQrCode } from "@/actions/qr-actions";

type SavedQrListProps = {
  initialItems: QrCode[];
};

export function SavedQrList({ initialItems }: SavedQrListProps) {
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

  if (items.length === 0) {
    return <p className="text-muted-foreground">No saved QR codes yet.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {items.map((item) => (
        <SavedQrCard key={item.id} qrCode={item} onDelete={handleDelete} />
      ))}
    </div>
  );
}
