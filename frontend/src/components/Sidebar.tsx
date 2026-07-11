"use client";

import { useState } from "react";
import { Search, SquarePen, MoreHorizontal, SlidersHorizontal } from "lucide-react";
import { Conversation } from "@/lib/types";
import { cn } from "@/lib/utils";
import ConversationList from "./ConversationList";

interface SidebarProps {
  conversations: Conversation[];
  activeId: number | null;
  currentUserId: number;
  onSelect: (id: number) => void;
  onNewChat: () => void;
  onSearch: (query: string) => void;
}

export default function Sidebar({
  conversations,
  activeId,
  currentUserId,
  onSelect,
  onNewChat,
  onSearch,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "groups">("all");

  let filtered = searchQuery
    ? conversations.filter(
        (c) =>
          c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.last_message?.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  if (filter === "unread") filtered = filtered.filter((c) => c.unread_count > 0);
  if (filter === "groups") filtered = filtered.filter((c) => c.type === "group");

  return (
    <div className="w-[380px] min-w-[320px] flex flex-col bg-sidebar border-r border-signal h-full">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <h1 className="text-[22px] font-semibold text-primary">Chats</h1>
        <div className="flex items-center gap-0.5">
          <button
            onClick={onNewChat}
            className="p-2 text-secondary hover:text-primary rounded-lg hover:bg-hover transition-colors"
            title="New chat"
          >
            <SquarePen className="h-5 w-5" strokeWidth={1.75} />
          </button>
          <button
            className="p-2 text-secondary hover:text-primary rounded-lg hover:bg-hover transition-colors"
            title="More options"
          >
            <MoreHorizontal className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <div className="px-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-3 bg-input rounded-full px-4 py-2">
            <Search className="h-4 w-4 text-secondary flex-shrink-0" strokeWidth={2} />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                onSearch(e.target.value);
              }}
              className="flex-1 bg-transparent text-[14px] text-primary outline-none placeholder:text-secondary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-secondary text-xs hover:text-primary"
              >
                ✕
              </button>
            )}
          </div>
          <button
            className="p-2.5 text-secondary hover:text-primary rounded-lg hover:bg-hover transition-colors"
            title="Filter"
          >
            <SlidersHorizontal className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="flex gap-2 px-4 pb-2 overflow-x-auto">
        {(["all", "unread", "groups"] as const).map((chip) => (
          <button
            key={chip}
            onClick={() => setFilter(chip)}
            className={cn(
              "px-3.5 py-1 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors capitalize",
              filter === chip
                ? "bg-signal-blue text-white"
                : "bg-input text-secondary hover:bg-hover"
            )}
          >
            {chip === "all" ? "All" : chip === "unread" ? "Unread" : "Groups"}
          </button>
        ))}
      </div>

      <ConversationList
        conversations={filtered}
        activeId={activeId}
        onSelect={onSelect}
        currentUserId={currentUserId}
      />
    </div>
  );
}
