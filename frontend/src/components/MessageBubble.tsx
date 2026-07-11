"use client";

import { Message } from "@/lib/types";
import { formatMessageTime, getSenderColor } from "@/lib/utils";
import MessageStatusIcon from "./MessageStatusIcon";
import Avatar from "./Avatar";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showSender?: boolean;
  showAvatar?: boolean;
}

export default function MessageBubble({ message, isOwn, showSender, showAvatar }: MessageBubbleProps) {
  if (isOwn) {
    return (
      <div className="flex justify-end mb-2 px-2 animate-fade-in">
        <div className="flex items-end gap-2 max-w-[65%]">
          <span className="text-[11px] text-timestamp mb-1 flex-shrink-0">
            {formatMessageTime(message.created_at)}
          </span>
          <div className="bg-bubble-out rounded-2xl rounded-tr-sm px-3 py-2 shadow-bubble">
            <p className="text-[14.2px] leading-[19px] text-on-blue break-words whitespace-pre-wrap">
              {message.content}
            </p>
            <div className="flex items-center justify-end gap-1 mt-0.5">
              <MessageStatusIcon status={message.status} variant="bubble" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const senderColor = getSenderColor(message.sender.display_name);

  return (
    <div className="flex justify-start mb-3 px-2 animate-fade-in gap-2">
      {showAvatar ? (
        <Avatar user={message.sender} size="xs" className="mt-5" />
      ) : (
        <div className="w-7 flex-shrink-0" />
      )}
      <div className="flex items-end gap-2 max-w-[65%]">
        <div className="bg-bubble-in rounded-2xl rounded-tl-sm px-3 py-2 shadow-bubble">
          {showSender && (
            <p className="text-[13px] font-semibold mb-0.5" style={{ color: senderColor }}>
              {message.sender.display_name}
            </p>
          )}
          <p className="text-[14.2px] leading-[19px] text-primary break-words whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
        <span className="text-[11px] text-timestamp mb-1 flex-shrink-0">
          {formatMessageTime(message.created_at)}
        </span>
      </div>
    </div>
  );
}
