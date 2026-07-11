const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

function parseApiError(data: unknown): string {
  if (!data || typeof data !== "object") return "Request failed";
  const err = data as { detail?: unknown; message?: string };
  if (typeof err.detail === "string") return err.detail;
  if (Array.isArray(err.detail)) {
    return err.detail.map((e: { msg?: string }) => e.msg || "Validation error").join(", ");
  }
  if (typeof err.message === "string") return err.message;
  return "Request failed";
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== "undefined") {
      if (token) localStorage.setItem("token", token);
      else localStorage.removeItem("token");
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("token");
    }
    return this.token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };
    const token = this.getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    let res: Response;
    try {
      res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    } catch {
      const isProduction =
        typeof window !== "undefined" && !window.location.hostname.includes("localhost");
      if (isProduction && API_BASE.includes("localhost")) {
        throw new Error(
          "Backend not configured. Set NEXT_PUBLIC_API_URL on Vercel and redeploy."
        );
      }
      throw new Error(
        "Cannot reach server. Wait 30 seconds (Render may be waking up) and try again."
      );
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(parseApiError(err));
    }
    if (res.status === 204) return {} as T;
    return res.json();
  }

  // Auth
  register(data: {
    phone?: string;
    username?: string;
    display_name: string;
    password: string;
    avatar_url?: string;
  }) {
    return this.request<{ access_token: string; user: import("./types").User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  login(identifier: string, password: string) {
    return this.request<{ access_token: string; user: import("./types").User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    });
  }

  verifyOtp(phone: string, otp: string) {
    return this.request<{ verified: boolean }>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ phone, otp }),
    });
  }

  getMe() {
    return this.request<import("./types").User>("/auth/me");
  }

  updateMe(data: { display_name?: string; avatar_url?: string }) {
    return this.request<import("./types").User>("/auth/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  logout() {
    return this.request("/auth/logout", { method: "POST" });
  }

  // Contacts
  getContacts() {
    return this.request<import("./types").Contact[]>("/contacts");
  }

  addContact(identifier: string) {
    return this.request<import("./types").Contact>("/contacts", {
      method: "POST",
      body: JSON.stringify({ identifier }),
    });
  }

  searchUsers(q: string) {
    return this.request<import("./types").User[]>(`/contacts/search?q=${encodeURIComponent(q)}`);
  }

  // Conversations
  getConversations() {
    return this.request<import("./types").Conversation[]>("/conversations");
  }

  getConversation(id: number) {
    return this.request<import("./types").Conversation>(`/conversations/${id}`);
  }

  searchConversations(q: string) {
    return this.request<{ users: import("./types").User[]; conversations: import("./types").Conversation[] }>(
      `/conversations/search?q=${encodeURIComponent(q)}`
    );
  }

  createDirectConversation(userId: number) {
    return this.request<import("./types").Conversation>("/conversations/direct", {
      method: "POST",
      body: JSON.stringify({ user_id: userId }),
    });
  }

  createGroupConversation(name: string, memberIds: number[]) {
    return this.request<import("./types").Conversation>("/conversations/group", {
      method: "POST",
      body: JSON.stringify({ name, member_ids: memberIds }),
    });
  }

  getMembers(conversationId: number) {
    return this.request<import("./types").ConversationMember[]>(`/conversations/${conversationId}/members`);
  }

  addGroupMember(conversationId: number, userId: number) {
    return this.request<import("./types").Conversation>(`/conversations/${conversationId}/members`, {
      method: "POST",
      body: JSON.stringify({ user_id: userId }),
    });
  }

  removeGroupMember(conversationId: number, userId: number) {
    return this.request<import("./types").Conversation>(`/conversations/${conversationId}/members/${userId}`, {
      method: "DELETE",
    });
  }

  // Messages
  getMessages(conversationId: number, beforeId?: number) {
    const params = beforeId ? `?before_id=${beforeId}` : "";
    return this.request<import("./types").Message[]>(`/conversations/${conversationId}/messages${params}`);
  }

  sendMessage(conversationId: number, content: string) {
    return this.request<import("./types").Message>(`/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  }

  markRead(conversationId: number) {
    return this.request(`/conversations/${conversationId}/read`, { method: "POST" });
  }
}

export const api = new ApiClient();

export function getWsUrl(): string {
  const base = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";
  return base;
}
