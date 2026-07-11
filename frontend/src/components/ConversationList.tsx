"use client";

import { Conversation } from "@/lib/types";
import { cn, formatConversationTime } from "@/lib/utils";
import Avatar from "./Avatar";
import MessageStatusIcon from "./MessageStatusIcon";

interface ConversationListProps {
  conversations: Conversation[];
  activeId: number | null;
  onSelect: (id: number) => void;
  currentUserId: number;
}

export default function ConversationList({
  conversations,
  activeId,
  onSelect,
  currentUserId,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-secondary p-8 text-center">
        <p className="text-base font-medium text-primary">No conversations yet</p>
        <p className="text-sm mt-1">Start a new chat to begin messaging</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto flex-1">
      {conversations.map((conv) => {
        const otherMember = conv.members.find((m) => m.user.id !== currentUserId);
        const isOnline = conv.type === "direct" && otherMember?.user.is_online;
        const lastMsg = conv.last_message;
        const isOwnLast = lastMsg?.sender_id === currentUserId;

        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 hover:bg-hover transition-colors text-left",
              activeId === conv.id && "bg-active"
            )}
          >
            <Avatar
              user={{ display_name: conv.name || "Chat", avatar_url: conv.avatar_url }}
              size="md"
              showOnline={conv.type === "direct"}
              isOnline={isOnline}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-[16px] text-primary truncate">{conv.name}</span>
                {lastMsg && (
                  <span className="text-[12px] text-secondary flex-shrink-0">
                    {formatConversationTime(lastMsg.created_at)}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between mt-0.5 gap-2">
                <div className="flex items-center gap-1 min-w-0">
                  {isOwnLast && lastMsg && (
                    <MessageStatusIcon status={lastMsg.status} variant="list" />
                  )}
                  <p className="text-[14px] text-secondary truncate">
                    {lastMsg
                      ? isOwnLast
                        ? lastMsg.content
                        : conv.type === "group"
                        ? `${lastMsg.sender_name}: ${lastMsg.content}`
                        : lastMsg.content
                      : "No messages yet"}
                  </p>
                </div>
                {conv.unread_count > 0 && (
                  <span className="flex-shrink-0 bg-badge text-white text-[11px] font-semibold rounded-full h-[20px] min-w-[20px] flex items-center justify-center px-1.5">
                    {conv.unread_count}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
