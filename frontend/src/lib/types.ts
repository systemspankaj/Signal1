export type MessageStatus = "sending" | "sent" | "delivered" | "read";
export type ConversationType = "direct" | "group";
export type MemberRole = "member" | "admin";

export interface User {
  id: number;
  phone?: string;
  username?: string;
  display_name: string;
  avatar_url?: string;
  is_online: boolean;
  last_seen?: string;
}

export interface Contact {
  id: number;
  user: User;
  created_at: string;
}

export interface ConversationMember {
  id: number;
  user: User;
  role: MemberRole;
  joined_at: string;
}

export interface LastMessage {
  id: number;
  content: string;
  sender_id: number;
  sender_name: string;
  status: MessageStatus;
  created_at: string;
}

export interface Conversation {
  id: number;
  type: ConversationType;
  name?: string;
  avatar_url?: string;
  members: ConversationMember[];
  last_message?: LastMessage;
  unread_count: number;
  updated_at: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender: User;
  content: string;
  status: MessageStatus;
  reply_to_id?: number;
  created_at: string;
}

export interface WSEvent {
  type: string;
  payload: Record<string, unknown>;
}
