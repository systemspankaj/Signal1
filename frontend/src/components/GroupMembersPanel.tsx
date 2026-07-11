"use client";

import { X, UserPlus, UserMinus } from "lucide-react";
import { Conversation, ConversationMember } from "@/lib/types";
import Avatar from "./Avatar";

interface GroupMembersPanelProps {
  conversation: Conversation;
  members: ConversationMember[];
  currentUserId: number;
  onClose: () => void;
  onAddMember: () => void;
  onRemoveMember: (userId: number) => void;
}

export default function GroupMembersPanel({
  conversation,
  members,
  currentUserId,
  onClose,
  onAddMember,
  onRemoveMember,
}: GroupMembersPanelProps) {
  const currentMember = members.find((m) => m.user.id === currentUserId);
  const isAdmin = currentMember?.role === "admin";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-sidebar rounded-xl w-full max-w-sm mx-4 shadow-2xl animate-fade-in border border-signal">
        <div className="flex items-center justify-between px-6 py-4 border-b border-signal">
          <h2 className="text-lg font-semibold text-primary">Group members</h2>
          <button onClick={onClose} className="text-secondary hover:text-primary">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-4 text-center border-b border-signal">
          <Avatar
            user={{ display_name: conversation.name || "Group", avatar_url: conversation.avatar_url }}
            size="lg"
            className="mx-auto"
          />
          <h3 className="text-xl font-medium text-primary mt-3">{conversation.name}</h3>
          <p className="text-sm text-secondary">{members.length} members</p>
        </div>

        {isAdmin && (
          <button
            onClick={onAddMember}
            className="w-full flex items-center gap-3 px-6 py-3 hover:bg-hover text-signal-blue"
          >
            <UserPlus className="h-5 w-5" />
            Add member
          </button>
        )}

        <div className="max-h-64 overflow-y-auto">
          {members.map((member) => (
            <div key={member.id} className="flex items-center gap-3 px-6 py-3 hover:bg-hover">
              <Avatar user={member.user} size="sm" showOnline isOnline={member.user.is_online} />
              <div className="flex-1 min-w-0">
                <p className="text-primary truncate">
                  {member.user.display_name}
                  {member.user.id === currentUserId && " (You)"}
                </p>
                <p className="text-xs text-secondary">
                  {member.role === "admin" ? "Admin" : member.user.is_online ? "online" : "offline"}
                </p>
              </div>
              {isAdmin && member.user.id !== currentUserId && (
                <button
                  onClick={() => onRemoveMember(member.user.id)}
                  className="text-secondary hover:text-red-500 p-1"
                  title="Remove member"
                >
                  <UserMinus className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
