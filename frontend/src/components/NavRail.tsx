"use client";

import { Menu, MessageCircle, Phone, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavRailProps {
  unreadCount: number;
  onMenuOpen: () => void;
}

export default function NavRail({ unreadCount, onMenuOpen }: NavRailProps) {
  const navItems = [
    { id: "chats", icon: MessageCircle, label: "Chats", active: true, badge: unreadCount },
    { id: "calls", icon: Phone, label: "Calls", active: false, badge: 0, soon: true },
    { id: "stories", icon: Layers, label: "Stories", active: false, badge: 0, soon: true },
  ];

  return (
    <div className="w-[72px] min-w-[72px] flex flex-col items-center py-3 bg-nav border-r border-signal h-full">
      <button
        onClick={onMenuOpen}
        className="mb-4 p-2 rounded-lg text-secondary hover:bg-hover transition-colors"
        title="Menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      <div className="flex flex-col items-center gap-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={cn(
                "relative flex flex-col items-center justify-center w-[52px] h-[52px] rounded-xl transition-colors",
                item.active ? "bg-nav-active text-primary" : "text-secondary hover:bg-hover",
                item.soon && "opacity-60"
              )}
              title={item.soon ? `${item.label} (Coming soon)` : item.label}
            >
              <Icon className="h-6 w-6" strokeWidth={1.75} />
              {item.badge > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-badge text-white text-[10px] font-semibold rounded-full flex items-center justify-center">
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-auto pt-2">
        <div className="w-8 h-8 rounded-lg bg-signal-blue flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v2h-2v-2zm0-8h2v6h-2V9z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
