"use client";

import { useState } from "react";
import { X, Search } from "lucide-react";
import { api } from "@/lib/api";
import { User } from "@/lib/types";
import Avatar from "./Avatar";

interface NewGroupModalProps {
  onClose: () => void;
  onGroupCreated: (conversationId: number) => void;
}

export default function NewGroupModal({ onClose, onGroupCreated }: NewGroupModalProps) {
  const [step, setStep] = useState<"members" | "name">("members");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selected, setSelected] = useState<User[]>([]);
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (q.length < 1) { setUsers([]); return; }
    try {
      setUsers(await api.searchUsers(q));
    } catch { setUsers([]); }
  };

  const toggleUser = (user: User) => {
    setSelected((prev) =>
      prev.find((u) => u.id === user.id) ? prev.filter((u) => u.id !== user.id) : [...prev, user]
    );
  };

  const createGroup = async () => {
    if (!groupName.trim() || selected.length === 0) return;
    setLoading(true);
    setError("");
    try {
      const conv = await api.createGroupConversation(groupName.trim(), selected.map((u) => u.id));
      onGroupCreated(conv.id);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-sidebar rounded-xl w-full max-w-md mx-4 shadow-2xl animate-fade-in border border-signal">
        <div className="flex items-center justify-between px-6 py-4 border-b border-signal">
          <h2 className="text-lg font-semibold text-primary">
            {step === "members" ? "Add group members" : "Group name"}
          </h2>
          <button onClick={onClose} className="text-secondary hover:text-primary">
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === "members" ? (
          <>
            {selected.length > 0 && (
              <div className="flex flex-wrap gap-2 px-6 py-3 border-b border-signal">
                {selected.map((u) => (
                  <span key={u.id} className="flex items-center gap-1 bg-input rounded-full px-3 py-1 text-sm text-primary">
                    {u.display_name}
                    <button onClick={() => toggleUser(u)} className="text-secondary hover:text-primary ml-1">×</button>
                  </span>
                ))}
              </div>
            )}
            <div className="px-6 py-4">
              <div className="flex items-center gap-3 bg-input rounded-full px-4 py-2">
                <Search className="h-4 w-4 text-secondary" />
                <input
                  type="text"
                  placeholder="Search contacts"
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="flex-1 bg-transparent text-primary outline-none"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {users.map((user) => {
                const isSelected = selected.some((u) => u.id === user.id);
                return (
                  <button
                    key={user.id}
                    onClick={() => toggleUser(user)}
                    className="w-full flex items-center gap-3 px-6 py-3 hover:bg-hover"
                  >
                    <Avatar user={user} size="sm" />
                    <span className="text-primary flex-1 text-left">{user.display_name}</span>
                    <div className={`h-5 w-5 rounded-full border-2 ${isSelected ? "bg-signal-blue border-signal-blue" : "border-secondary"}`} />
                  </button>
                );
              })}
            </div>
            <div className="px-6 py-4 flex justify-end">
              <button
                onClick={() => setStep("name")}
                disabled={selected.length === 0}
                className="bg-signal-blue text-white px-6 py-2 rounded-full disabled:opacity-50 hover:bg-signal-blue-hover transition-colors"
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <div className="px-6 py-6">
            <input
              type="text"
              placeholder="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full bg-input rounded-lg px-4 py-3 text-primary outline-none text-lg border-b-2 border-signal-blue"
              autoFocus
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <div className="flex justify-between mt-6">
              <button onClick={() => setStep("members")} className="text-signal-blue px-4 py-2">Back</button>
              <button
                onClick={createGroup}
                disabled={!groupName.trim() || loading}
                className="bg-signal-blue text-white px-6 py-2 rounded-full disabled:opacity-50 hover:bg-signal-blue-hover"
              >
                Create
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
