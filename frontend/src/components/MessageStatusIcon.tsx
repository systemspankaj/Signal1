import { MessageStatus } from "@/lib/types";
import { Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageStatusIconProps {
  status: MessageStatus;
  variant?: "bubble" | "list";
}

export default function MessageStatusIcon({ status, variant = "bubble" }: MessageStatusIconProps) {
  const isBubble = variant === "bubble";
  const colorClass = isBubble
    ? "text-white/80"
    : status === "read"
    ? "text-signal-blue"
    : "text-secondary";

  if (status === "sending") {
    return <span className={cn("text-[10px]", colorClass)}>○</span>;
  }
  if (status === "sent") {
    return <Check className={cn("h-3.5 w-3.5", colorClass)} strokeWidth={2.5} />;
  }
  if (status === "delivered") {
    return <CheckCheck className={cn("h-3.5 w-3.5", colorClass)} strokeWidth={2.5} />;
  }
  return <CheckCheck className={cn("h-3.5 w-3.5", isBubble ? "text-white" : "text-signal-blue")} strokeWidth={2.5} />;
}
