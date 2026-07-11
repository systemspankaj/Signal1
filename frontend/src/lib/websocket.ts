import { WSEvent } from "./types";

type EventHandler = (event: WSEvent) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private handlers: Set<EventHandler> = new Set();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private token: string | null = null;

  connect(token: string) {
    this.token = token;
    if (this.ws?.readyState === WebSocket.OPEN) return;

    const url = `${process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws"}?token=${token}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    };

    this.ws.onmessage = (e) => {
      try {
        const event: WSEvent = JSON.parse(e.data);
        this.handlers.forEach((h) => h(event));
      } catch {
        // ignore parse errors
      }
    };

    this.ws.onclose = () => {
      if (this.token) {
        this.reconnectTimer = setTimeout(() => this.connect(this.token!), 3000);
      }
    };
  }

  disconnect() {
    this.token = null;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }

  subscribe(handler: EventHandler) {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  send(type: string, payload: Record<string, unknown>) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  sendMessage(conversationId: number, content: string) {
    this.send("send_message", { conversation_id: conversationId, content });
  }

  setTyping(conversationId: number, isTyping: boolean) {
    this.send("typing", { conversation_id: conversationId, is_typing: isTyping });
  }

  setViewing(conversationId: number, isViewing: boolean) {
    this.send("viewing", { conversation_id: conversationId, is_viewing: isViewing });
  }
}

export const wsClient = new WebSocketClient();
