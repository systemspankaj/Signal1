"use client";

import { useEffect, useRef } from "react";
import { Message, Conversation } from "@/lib/types";
import { Video, Search, MoreHorizontal } from "lucide-react";
import Avatar from "./Avatar";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import { wsClient } from "@/lib/websocket";

interface ChatPaneProps {
  conversation: Conversation | null;
  messages: Message[];
  currentUserId: number;
  typingUsers: string[];
  onSendMessage: (content: string) => void;
  onShowMembers?: () => void;
}

export default function ChatPane({
  conversation,
  messages,
  currentUserId,
  typingUsers,
  onSendMessage,
  onShowMembers,
}: ChatPaneProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  useEffect(() => {
    if (conversation) {
      wsClient.setViewing(conversation.id, true);
      return () => wsClient.setViewing(conversation.id, false);
    }
  }, [conversation?.id]);

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-panel min-w-0">
        <div className="text-center max-w-sm px-8">
          <div className="mb-8 opacity-40">
            <svg viewBox="0 0 303 172" width="280" className="mx-auto">
              <path
                fill="currentColor"
                className="text-signal-blue"
                d="M229.565 160.229c-32.187 0-58.229-26.042-58.229-58.229S197.378 43.771 229.565 43.771c32.187 0 58.229 26.042 58.229 58.229s-26.042 58.229-58.229 58.229zm-156.13 0C41.248 160.229 15.206 134.187 15.206 102S41.248 43.771 73.435 43.771c32.187 0 58.229 26.042 58.229 58.229s-26.042 58.229-58.229 58.229z"
              />
            </svg>
          </div>
          <h2 className="text-[28px] font-light text-primary mb-3">Signal Clone</h2>
          <p className="text-secondary text-[14px] leading-relaxed">
            Send and receive messages without keeping your phone online.
            Use Signal Clone on up to 4 linked devices and 1 mobile device.
          </p>
          <div className="mt-8 flex items-center justify-center gap-1.5 text-secondary text-xs">
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm3.5 4.5a.5.5 0 00-.7-.7L7 8.8 5.2 7a.5.5 0 00-.7.7l2 2a.5.5 0 00.7 0l4.3-4.3z" />
            </svg>
            End-to-end encrypted (simulated)
          </div>
        </div>
      </div>
    );
  }

  const otherMember = conversation.members.find((m) => m.user.id !== currentUserId);
  const isOnline = conversation.type === "direct" && otherMember?.user.is_online;
  const isGroup = conversation.type === "group";

  return (
    <div className="flex-1 flex flex-col bg-panel min-w-0">
      <div className="flex items-center justify-between px-4 py-2.5 bg-sidebar border-b border-signal">
        <button
          className="flex items-center gap-3 flex-1 min-w-0"
          onClick={isGroup ? onShowMembers : undefined}
        >
          <Avatar
            user={{ display_name: conversation.name || "Chat", avatar_url: conversation.avatar_url }}
            size="sm"
            showOnline={!isGroup}
            isOnline={isOnline}
          />
          <div className="text-left min-w-0">
            <h3 className="text-[16px] font-medium text-primary truncate">{conversation.name}</h3>
            <p className="text-[13px] text-secondary">
              {typingUsers.length > 0
                ? typingUsers.length === 1
                  ? `${typingUsers[0]} is typing...`
                  : "Several people are typing..."
                : isOnline
                ? "online"
                : isGroup
                ? `${conversation.members.length} members`
                : "offline"}
            </p>
          </div>
        </button>
        <div className="flex items-center">
          <button
            className="p-2 text-secondary hover:text-primary rounded-lg hover:bg-hover transition-colors"
            title="Video call (Coming soon)"
          >
            <Video className="h-5 w-5" strokeWidth={1.75} />
          </button>
          <button className="p-2 text-secondary hover:text-primary rounded-lg hover:bg-hover transition-colors">
            <Search className="h-5 w-5" strokeWidth={1.75} />
          </button>
          <button className="p-2 text-secondary hover:text-primary rounded-lg hover:bg-hover transition-colors">
            <MoreHorizontal className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 chat-wallpaper">
        <div className="max-w-3xl mx-auto">
          {messages.map((msg, i) => {
            const prev = messages[i - 1];
            const showAvatar =
              isGroup &&
              msg.sender_id !== currentUserId &&
              (!prev || prev.sender_id !== msg.sender_id);

            return (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.sender_id === currentUserId}
                showSender={isGroup && msg.sender_id !== currentUserId}
                showAvatar={showAvatar}
              />
            );
          })}
          {typingUsers.length > 0 && (
            <div className="flex justify-start mb-2 px-2 gap-2">
              <div className="w-7" />
              <div className="bg-bubble-in rounded-2xl rounded-tl-sm px-4 py-2.5 flex gap-1">
                <span className="typing-dot w-2 h-2 rounded-full bg-secondary inline-block" />
                <span className="typing-dot w-2 h-2 rounded-full bg-secondary inline-block" />
                <span className="typing-dot w-2 h-2 rounded-full bg-secondary inline-block" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <MessageInput conversationId={conversation.id} onSend={onSendMessage} />
    </div>
  );
}
