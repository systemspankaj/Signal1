"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { wsClient } from "@/lib/websocket";
import { Conversation, Message, ConversationMember } from "@/lib/types";
import SideMenu from "@/components/SideMenu";
import NavRail from "@/components/NavRail";
import Sidebar from "@/components/Sidebar";
import ChatPane from "@/components/ChatPane";
import NewChatModal from "@/components/NewChatModal";
import NewGroupModal from "@/components/NewGroupModal";
import GroupMembersPanel from "@/components/GroupMembersPanel";

export default function ChatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<ConversationMember[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<number, string[]>>({});

  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

  const activeConversation = conversations.find((c) => c.id === activeId) || null;

  const loadConversations = useCallback(async () => {
    try {
      const convs = await api.getConversations();
      setConversations(convs);
    } catch {
      // ignore
    }
  }, []);

  const loadMessages = useCallback(async (convId: number) => {
    try {
      const msgs = await api.getMessages(convId);
      setMessages(msgs);
      await api.markRead(convId);
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, unread_count: 0 } : c))
      );
    } catch {
      // ignore
    }
  }, []);

  const loadMembers = useCallback(async (convId: number) => {
    try {
      const m = await api.getMembers(convId);
      setMembers(m);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) loadConversations();
  }, [user, loadConversations]);

  useEffect(() => {
    if (activeId) {
      loadMessages(activeId);
      loadMembers(activeId);
    } else {
      setMessages([]);
      setMembers([]);
    }
  }, [activeId, loadMessages, loadMembers]);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = wsClient.subscribe((event) => {
      if (event.type === "new_message") {
        const msg = event.payload as unknown as Message;
        if (msg.conversation_id === activeId) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          if (msg.sender_id !== user.id) {
            api.markRead(msg.conversation_id);
          }
        }
        loadConversations();
      }

      if (event.type === "message_status") {
        const { message_id, status } = event.payload as { message_id: number; status: string };
        setMessages((prev) =>
          prev.map((m) => (m.id === message_id ? { ...m, status: status as Message["status"] } : m))
        );
        loadConversations();
      }

      if (event.type === "typing") {
        const { conversation_id, user_name, is_typing } = event.payload as {
          conversation_id: number;
          user_id: number;
          user_name: string;
          is_typing: boolean;
        };
        setTypingUsers((prev) => {
          const current = prev[conversation_id] || [];
          if (is_typing) {
            return { ...prev, [conversation_id]: [...new Set([...current, user_name])] };
          }
          return { ...prev, [conversation_id]: current.filter((n) => n !== user_name) };
        });
      }

      if (event.type === "user_online" || event.type === "user_offline") {
        loadConversations();
        if (activeId) loadMembers(activeId);
      }
    });

    return unsubscribe;
  }, [user, activeId, loadConversations, loadMembers]);

  const handleSendMessage = async (content: string) => {
    if (!activeId || !user) return;

    const optimistic: Message = {
      id: Date.now(),
      conversation_id: activeId,
      sender_id: user.id,
      sender: user,
      content,
      status: "sending",
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    wsClient.sendMessage(activeId, content);
    loadConversations();
  };

  const handleConversationCreated = (id: number) => {
    loadConversations();
    setActiveId(id);
  };

  const handleRemoveMember = async (userId: number) => {
    if (!activeId) return;
    try {
      await api.removeGroupMember(activeId, userId);
      loadMembers(activeId);
      loadConversations();
    } catch {
      // ignore
    }
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-panel">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-signal-blue border-t-transparent" />
      </div>
    );
  }

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);

  return (
    <div className="flex h-screen overflow-hidden bg-app">
      <NavRail unreadCount={totalUnread} onMenuOpen={() => setShowMenu(true)} />
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        currentUserId={user.id}
        onSelect={setActiveId}
        onNewChat={() => setShowNewChat(true)}
        onSearch={() => {}}
      />
      <ChatPane
        conversation={activeConversation}
        messages={messages}
        currentUserId={user.id}
        typingUsers={activeId ? typingUsers[activeId] || [] : []}
        onSendMessage={handleSendMessage}
        onShowMembers={() => setShowMembers(true)}
      />

      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onConversationCreated={handleConversationCreated}
        />
      )}
      {showNewGroup && (
        <NewGroupModal
          onClose={() => setShowNewGroup(false)}
          onGroupCreated={handleConversationCreated}
        />
      )}
      <SideMenu
        open={showMenu}
        onClose={() => setShowMenu(false)}
        onNewGroup={() => setShowNewGroup(true)}
      />
      {showMembers && activeConversation && (
        <GroupMembersPanel
          conversation={activeConversation}
          members={members}
          currentUserId={user.id}
          onClose={() => setShowMembers(false)}
          onAddMember={() => {
            setShowMembers(false);
            setShowNewChat(true);
          }}
          onRemoveMember={handleRemoveMember}
        />
      )}
    </div>
  );
}
