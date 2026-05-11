import { io, type Socket } from "socket.io-client";
import { supabase } from "@/utils/supabase";
import type {
  RealtimeEventName,
  RealtimeEventPayload,
  RealtimeSubscription,
} from "@/types/realtime.types";

type AnyRealtimeHandler = (event: string, payload: unknown) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private readonly anyHandlers = new Set<AnyRealtimeHandler>();
  private readonly maxReconnectAttempts = 5;
  private connectPromise: Promise<Socket> | null = null;

  async connect(): Promise<Socket> {
    if (this.socket?.connected) return this.socket;
    if (this.connectPromise) return this.connectPromise;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error("No authentication token available");
    }

    const wsURL = this.getSocketUrl();
    const socket = io(`${wsURL}/socket`, {
      auth: { token: session.access_token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 20000,
    });

    socket.onAny((event, payload) => {
      this.anyHandlers.forEach((handler) => handler(event, payload));
    });

    this.socket = socket;
    this.connectPromise = new Promise<Socket>((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (!socket.connected) {
          this.connectPromise = null;
          reject(new Error("WebSocket connection timeout"));
        }
      }, 10000);

      socket.once("connect", () => {
        clearTimeout(timeout);
        this.connectPromise = null;
        resolve(socket);
      });

      socket.once("connect_error", (error) => {
        clearTimeout(timeout);
        this.connectPromise = null;
        reject(error);
      });
    });

    return this.connectPromise;
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.connectPromise = null;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  subscribe(subscription: RealtimeSubscription): void {
    this.socket?.emit("subscribe", subscription);
  }

  unsubscribe(subscription: RealtimeSubscription): void {
    this.socket?.emit("unsubscribe", subscription);
  }

  on<EventName extends RealtimeEventName>(
    event: EventName,
    callback: (payload: RealtimeEventPayload<EventName>) => void,
  ): void {
    (this.socket as any)?.on(event, callback);
  }

  off<EventName extends RealtimeEventName>(
    event: EventName,
    callback?: (payload: RealtimeEventPayload<EventName>) => void,
  ): void {
    (this.socket as any)?.off(event, callback);
  }

  onAny(callback: AnyRealtimeHandler): () => void {
    this.anyHandlers.add(callback);
    return () => {
      this.anyHandlers.delete(callback);
    };
  }

  private getSocketUrl(): string {
    const baseURL =
      process.env.EXPO_PUBLIC_API_BASE_URL || "https://api.edulearn.fun";
    let wsURL: string;

    if (baseURL.startsWith("https://")) {
      wsURL = baseURL.replace("https://", "wss://");
    } else if (baseURL.startsWith("http://")) {
      wsURL = baseURL.replace("http://", "ws://");
    } else {
      wsURL =
        baseURL.startsWith("ws://") || baseURL.startsWith("wss://")
          ? baseURL
          : `wss://${baseURL}`;
    }

    return wsURL.replace(/\/$/, "");
  }
}

const websocketService = new WebSocketService();

export default websocketService;
