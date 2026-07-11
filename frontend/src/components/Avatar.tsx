"use client";

import Image from "next/image";
import { cn, getInitials } from "@/lib/utils";
import { User } from "@/lib/types";

interface AvatarProps {
  user: Pick<User, "display_name" | "avatar_url">;
  size?: "xs" | "sm" | "md" | "lg";
  showOnline?: boolean;
  isOnline?: boolean;
  className?: string;
}

const sizes = { xs: 28, sm: 36, md: 49, lg: 64 };

export default function Avatar({ user, size = "md", showOnline, isOnline, className }: AvatarProps) {
  const px = sizes[size];

  return (
    <div className={cn("relative flex-shrink-0", className)} style={{ width: px, height: px }}>
      {user.avatar_url ? (
        <Image
          src={user.avatar_url}
          alt={user.display_name}
          width={px}
          height={px}
          className="rounded-full object-cover"
          unoptimized
        />
      ) : (
        <div
          className="flex items-center justify-center rounded-full bg-input text-secondary font-medium"
          style={{ width: px, height: px, fontSize: px * 0.35 }}
        >
          {getInitials(user.display_name)}
        </div>
      )}
      {showOnline && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-sidebar",
            size === "xs" || size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3",
            isOnline ? "bg-signal-green" : "bg-secondary"
          )}
        />
      )}
    </div>
  );
}
