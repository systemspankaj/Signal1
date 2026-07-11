"use client";

import { useState } from "react";
import { X, Search } from "lucide-react";
import { api } from "@/lib/api";
import { User } from "@/lib/types";
import Avatar from "./Avatar";

interface NewChatModalProps {
  onClose: () => void;
  onConversationCreated: (conversationId: number) => void;
}

export default function NewChatModal({ onClose, onConversationCreated }: NewChatModalProps) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (q.length < 1) { setUsers([]); return; }
    try {
      setUsers(await api.searchUsers(q));
    } catch { setUsers([]); }
  };

  const startChat = async (userId: number) => {
    setLoading(true);
    setError("");
    try {
      const conv = await api.createDirectConversation(userId);
      onConversationCreated(conv.id);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create conversation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-sidebar rounded-xl w-full max-w-md mx-4 shadow-2xl animate-fade-in border border-signal">
        <div className="flex items-center justify-between px-6 py-4 border-b border-signal">
          <h2 className="text-lg font-semibold text-primary">New chat</h2>
          <button onClick={onClose} className="text-secondary hover:text-primary">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-4">
          <div className="flex items-center gap-3 bg-input rounded-full px-4 py-2">
            <Search className="h-4 w-4 text-secondary" />
            <input
              type="text"
              placeholder="Search name or number"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="flex-1 bg-transparent text-primary outline-none text-[15px]"
              autoFocus
            />
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => startChat(user.id)}
              disabled={loading}
              className="w-full flex items-center gap-3 px-6 py-3 hover:bg-hover transition-colors"
            >
              <Avatar user={user} size="sm" showOnline isOnline={user.is_online} />
              <div className="text-left">
                <p className="text-primary font-medium">{user.display_name}</p>
                <p className="text-sm text-secondary">{user.username || user.phone}</p>
              </div>
            </button>
          ))}
          {query && users.length === 0 && (
            <p className="text-center text-secondary py-8 text-sm">No users found</p>
          )}
        </div>
      </div>
    </div>
  );
}
