import { format, isToday, isYesterday, parseISO, differenceInMinutes, differenceInHours, differenceInDays } from "date-fns";
import clsx from "clsx";

export function cn(...inputs: (string | boolean | undefined | null)[]) {
  return clsx(inputs);
}

const SENDER_COLORS = [
  "#7b5ea7",
  "#c49a6c",
  "#c4534e",
  "#4a90a4",
  "#6b8e23",
  "#d4698f",
  "#5b7c99",
  "#b8860b",
];

export function getSenderColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return SENDER_COLORS[Math.abs(hash) % SENDER_COLORS.length];
}

export function formatMessageTime(dateStr: string): string {
  const date = parseISO(dateStr);
  const mins = differenceInMinutes(new Date(), date);
  if (mins < 60) return `${Math.max(mins, 1)}m`;
  if (isToday(date)) return format(date, "h:mm a");
  return format(date, "M/d/yyyy");
}

export function formatConversationTime(dateStr: string): string {
  const date = parseISO(dateStr);
  const mins = differenceInMinutes(new Date(), date);
  const hours = differenceInHours(new Date(), date);
  const days = differenceInDays(new Date(), date);

  if (mins < 60) return `${Math.max(mins, 1)}m`;
  if (isToday(date)) return format(date, "h:mm a");
  if (isYesterday(date)) return "Yesterday";
  if (days < 7) return format(date, "EEE");
  return format(date, "M/d/yyyy");
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function avatarUrl(user: { display_name: string; avatar_url?: string }, seed?: string): string {
  if (user.avatar_url) return user.avatar_url;
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed || user.display_name}`;
}
