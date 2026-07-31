"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { LogOut, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu() {
  const { user } = useUser();
  const { openUserProfile, signOut } = useClerk();

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="size-[34px] cursor-pointer overflow-hidden rounded-full border border-border/70"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={user.imageUrl} alt="" className="size-full object-cover" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2.5 px-1.5 py-1.5 text-foreground">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={user.imageUrl} alt="" className="size-9 shrink-0 rounded-full object-cover" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user.fullName ?? user.username ?? "Account"}</p>
            <p className="truncate text-xs font-normal text-muted-foreground">
              {user.primaryEmailAddress?.emailAddress}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer px-2 py-2" onSelect={() => openUserProfile()}>
          <Settings className="size-4" />
          Manage Account
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer px-2 py-2"
          variant="destructive"
          onSelect={() => signOut({ redirectUrl: "/" })}
        >
          <LogOut className="size-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
