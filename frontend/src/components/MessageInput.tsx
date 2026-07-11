"use client";

import { useRef, useState, useCallback } from "react";
import { Smile, Paperclip, Mic, Send } from "lucide-react";
import { wsClient } from "@/lib/websocket";

interface MessageInputProps {
  conversationId: number;
  onSend: (content: string) => void;
}

export default function MessageInput({ conversationId, onSend }: MessageInputProps) {
  const [text, setText] = useState("");
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTyping = useRef(false);

  const handleTyping = useCallback(() => {
    if (!isTyping.current) {
      isTyping.current = true;
      wsClient.setTyping(conversationId, true);
    }
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      isTyping.current = false;
      wsClient.setTyping(conversationId, false);
    }, 2000);
  }, [conversationId]);

  const handleSend = () => {
    const content = text.trim();
    if (!content) return;
    onSend(content);
    setText("");
    if (isTyping.current) {
      isTyping.current = false;
      wsClient.setTyping(conversationId, false);
    }
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-1 px-4 py-3 bg-sidebar border-t border-signal">
      <button
        className="p-2 text-secondary hover:text-primary rounded-lg hover:bg-hover transition-colors"
        title="Emoji"
      >
        <Smile className="h-6 w-6" strokeWidth={1.5} />
      </button>
      <button
        className="p-2 text-secondary hover:text-primary rounded-lg hover:bg-hover transition-colors"
        title="Attach (Coming soon)"
      >
        <Paperclip className="h-6 w-6" strokeWidth={1.5} />
      </button>
      <div className="flex-1">
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            handleTyping();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Message"
          rows={1}
          className="w-full resize-none rounded-lg bg-input px-4 py-2.5 text-[15px] text-primary placeholder:text-secondary outline-none max-h-32 border border-transparent focus:border-signal-blue/30"
        />
      </div>
      {text.trim() ? (
        <button
          onClick={handleSend}
          className="p-2 text-signal-blue hover:text-signal-blue-hover transition-colors"
          title="Send"
        >
          <Send className="h-6 w-6" strokeWidth={1.75} />
        </button>
      ) : (
        <button
          className="p-2 text-secondary hover:text-primary rounded-lg hover:bg-hover transition-colors"
          title="Voice message (Coming soon)"
        >
          <Mic className="h-6 w-6" strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
}
