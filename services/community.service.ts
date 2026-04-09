import { io, Socket } from "socket.io-client";
import { supabase } from "@/utils/supabase";
import { BaseService } from "./base.service";
import type {
  Community,
  CommunityMember,
  UserCommunity,
  CommunityJoinRequest,
  RoomMessage,
  MessageReaction,
  ReactionCount,
  MessageMention,
  UserMention,
  CommunityMod,
  UserStatusEvent,
  RoomPresence,
  TypingEvent,
  NewMessageEvent,
  MessageDeletedEvent,
  ReactionEvent,
} from "@/interface/Community";

export class CommunityService extends BaseService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  async getPublicCommunities(): Promise<Community[]> {
    const response = await this.executeRequest<Community[]>(
      this.getClient().get("/community")
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async getAllCommunities(): Promise<Community[]> {
    const response = await this.executeRequest<Community[]>(
      this.getClient().get("/community/all")
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async getCommunityByInviteCode(inviteCode: string): Promise<Community> {
    const response = await this.executeRequest<Community>(
      this.getClient().get(`/community/invite/${inviteCode}`)
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async getCommunityById(communityId: string): Promise<Community> {
    const response = await this.executeRequest<Community>(
      this.getClient().get(`/community/${communityId}`)
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async updateCommunity(
    communityId: string,
    data: {
      title?: string;
      visibility?: "public" | "private";
      imageUrl?: string;
      inviteCode?: string;
    }
  ): Promise<Community> {
    const response = await this.executeRequest<Community>(
      this.getClient().put(`/community/${communityId}`, data)
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async deleteCommunity(communityId: string): Promise<{ message: string }> {
    const response = await this.executeRequest(
      this.getClient().delete(`/community/${communityId}`)
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async addMember(
    communityId: string,
    userId: string,
    role?: "mod" | "member"
  ): Promise<CommunityMember> {
    const response = await this.executeRequest<CommunityMember>(
      this.getClient().post(`/community/${communityId}/members`, { userId, role })
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async getCommunityMembers(communityId: string): Promise<CommunityMember[]> {
    const response = await this.executeRequest<CommunityMember[]>(
      this.getClient().get(`/community/${communityId}/members`)
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async getMemberCount(communityId: string): Promise<{ count: number }> {
    const response = await this.executeRequest(
      this.getClient().get(`/community/${communityId}/members/count`)
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async getUserCommunities(userId: string): Promise<UserCommunity[]> {
    const response = await this.executeRequest<UserCommunity[]>(
      this.getClient().get(`/community/user/${userId}/communities`)
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async getCommunityMod(communityId: string): Promise<CommunityMod | null> {
    const response = await this.executeRequest<CommunityMod>(
      this.getClient().get(`/community/${communityId}/mod`)
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async updateMemberRole(
    communityId: string,
    userId: string,
    role: "mod" | "member"
  ): Promise<CommunityMember> {
    const response = await this.executeRequest<CommunityMember>(
      this.getClient().put(`/community/${communityId}/members/${userId}/role`, { role })
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async removeMember(
    communityId: string,
    userId: string
  ): Promise<{ message: string }> {
    const response = await this.executeRequest(
      this.getClient().delete(`/community/${communityId}/members/${userId}`)
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async updateCommunityModByXP(communityId: string): Promise<{ message: string }> {
    const response = await this.executeRequest(
      this.getClient().post(`/community/${communityId}/update-mod`)
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async createJoinRequest(communityId: string, userId: string): Promise<CommunityJoinRequest> {
    const response = await this.executeRequest<CommunityJoinRequest>(
      this.getClient().post(`/community/${communityId}/join-requests`, { userId })
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async getPendingJoinRequests(
    communityId: string,
    userId?: string
  ): Promise<CommunityJoinRequest[]> {
    const params: any = {};
    if (userId) params.userId = userId;
    const response = await this.executeRequest<CommunityJoinRequest[]>(
      this.getClient().get(`/community/${communityId}/join-requests`, { params })
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async updateJoinRequestStatus(
    requestId: string,
    status: "approved" | "rejected",
    communityId: string,
    userId?: string
  ): Promise<CommunityJoinRequest> {
    const body: any = { status, communityId };
    if (userId) body.userId = userId;
    const response = await this.executeRequest<CommunityJoinRequest>(
      this.getClient().put(`/community/join-requests/${requestId}`, body)
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async deleteJoinRequest(requestId: string): Promise<{ message: string }> {
    const response = await this.executeRequest(
      this.getClient().delete(`/community/join-requests/${requestId}`)
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async resolveMentions(usernames: string[]): Promise<{ username: string; userId: string }[]> {
    const response = await this.executeRequest(
      this.getClient().post(`/community/resolve-mentions`, { usernames })
    );
    if (response.error) return [];
    return response.data ?? [];
  }

  async createMessage(
    communityId: string,
    content: string,
    mentionedUserIds?: string[],
    userId?: string
  ): Promise<RoomMessage> {
    const body: any = { content, mentionedUserIds };
    if (userId) body.userId = userId;
    const response = await this.executeRequest<RoomMessage>(
      this.getClient().post(`/community/${communityId}/messages`, body)
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async getRoomMessages(
    communityId: string,
    limit: number = 50,
    offset: number = 0,
    userId?: string
  ): Promise<RoomMessage[]> {
    const params: any = { limit, offset };
    if (userId) params.userId = userId;
    const response = await this.executeRequest<RoomMessage[]>(
      this.getClient().get(`/community/${communityId}/messages`, { params })
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async getMessageCount(communityId: string): Promise<{ count: number }> {
    const response = await this.executeRequest(
      this.getClient().get(`/community/${communityId}/messages/count`)
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async getMessageById(messageId: string): Promise<RoomMessage> {
    const response = await this.executeRequest<RoomMessage>(
      this.getClient().get(`/community/messages/${messageId}`)
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async updateMessage(messageId: string, content: string): Promise<RoomMessage> {
    const response = await this.executeRequest<RoomMessage>(
      this.getClient().put(`/community/messages/${messageId}`, { content })
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async deleteMessage(messageId: string, userId?: string): Promise<{ message: string }> {
    const config: any = {};
    if (userId) config.data = { userId };
    const response = await this.executeRequest(
      this.getClient().delete(`/community/messages/${messageId}`, config)
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async addReaction(
    messageId: string,
    reaction: string,
    userId?: string,
    communityId?: string
  ): Promise<MessageReaction> {
    const body: any = { reaction };
    if (userId) body.userId = userId;
    if (communityId) body.communityId = communityId;
    const response = await this.executeRequest<MessageReaction>(
      this.getClient().post(`/community/messages/${messageId}/reactions`, body)
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async getMessageReactions(messageId: string): Promise<MessageReaction[]> {
    const response = await this.executeRequest<MessageReaction[]>(
      this.getClient().get(`/community/messages/${messageId}/reactions`)
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async getReactionCounts(messageId: string): Promise<ReactionCount[]> {
    const response = await this.executeRequest<ReactionCount[]>(
      this.getClient().get(`/community/messages/${messageId}/reactions/count`)
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async removeReaction(messageId: string): Promise<{ message: string }> {
    const response = await this.executeRequest(
      this.getClient().delete(`/community/messages/${messageId}/reactions`)
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async getMessageMentions(messageId: string): Promise<MessageMention[]> {
    const response = await this.executeRequest<MessageMention[]>(
      this.getClient().get(`/community/messages/${messageId}/mentions`)
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async getUserMentions(userId: string, limit: number = 50): Promise<UserMention[]> {
    const response = await this.executeRequest<UserMention[]>(
      this.getClient().get(`/community/user/${userId}/mentions`, { params: { limit } })
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async connectWebSocket(): Promise<Socket> {
    if (this.socket?.connected) return this.socket;
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("No authentication token available");

    const baseURL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000";
    let wsURL: string;
    if (baseURL.startsWith("https://")) {
      wsURL = baseURL.replace("https://", "wss://");
    } else if (baseURL.startsWith("http://")) {
      wsURL = baseURL.replace("http://", "ws://");
    } else {
      wsURL = baseURL.startsWith("ws://") || baseURL.startsWith("wss://")
        ? baseURL
        : `ws://${baseURL}`;
    }
    wsURL = wsURL.replace(/\/$/, "");

    this.socket = io(`${wsURL}/community`, {
      auth: { token: session.access_token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 20000,
    });

    if (!this.socket) throw new Error("Failed to create socket instance");

    this.socket.on("connect", () => {
      this.reconnectAttempts = 0;
    });

    this.socket.on("disconnect", () => {
    });

    this.socket.on("connect_error", (error: any) => {
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.socket?.close();
      }
    });

    this.socket.on("connected", () => {
    });

    const socketInstance = this.socket;
    if (!socketInstance) throw new Error("Socket instance is null");

    return new Promise<Socket>((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (!socketInstance.connected) reject(new Error("WebSocket connection timeout"));
      }, 10000);

      socketInstance.once("connect", () => {
        clearTimeout(timeout);
        resolve(socketInstance);
      });

      socketInstance.once("connect_error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  disconnectWebSocket(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  joinRoom(communityId: string, userId?: string, callback?: (response: any) => void): void {
    if (!this.socket?.connected) {
      callback?.({ error: "WebSocket not connected" });
      return;
    }
    const data: any = { communityId };
    if (userId) data.userId = userId;
    this.socket.emit("join_room", data, callback);
  }

  leaveRoom(communityId: string, callback?: (response: any) => void): void {
    if (!this.socket?.connected) return;
    this.socket.emit("leave_room", { communityId }, callback);
  }

  sendMessage(
    communityId: string,
    content: string,
    mentionedUserIds?: string[],
    userId?: string,
    callback?: (response: any) => void
  ): void {
    if (!this.socket?.connected) {
      callback?.({ error: "WebSocket not connected" });
      return;
    }
    const data: any = { communityId, content, mentionedUserIds };
    if (userId) data.userId = userId;
    this.socket.emit("send_message", data, callback);
  }

  deleteMessageWS(
    messageId: string,
    communityId: string,
    callback?: (response: any) => void
  ): void {
    if (!this.socket) throw new Error("WebSocket not connected");
    this.socket.emit("delete_message", { messageId, communityId }, callback);
  }

  startTyping(communityId: string): void {
    if (!this.socket) return;
    this.socket.emit("typing_start", { communityId });
  }

  stopTyping(communityId: string): void {
    if (!this.socket) return;
    this.socket.emit("typing_stop", { communityId });
  }

  addReactionWS(
    messageId: string,
    communityId: string,
    reaction: string,
    callback?: (response: any) => void
  ): void {
    if (!this.socket) throw new Error("WebSocket not connected");
    this.socket.emit("add_reaction", { messageId, communityId, reaction }, callback);
  }

  removeReactionWS(
    messageId: string,
    communityId: string,
    callback?: (response: any) => void
  ): void {
    if (!this.socket) throw new Error("WebSocket not connected");
    this.socket.emit("remove_reaction", { messageId, communityId }, callback);
  }

  getOnlineUsers(callback?: (response: any) => void): void {
    if (!this.socket) throw new Error("WebSocket not connected");
    this.socket.emit("get_online_users", {}, callback);
  }

  getRoomPresence(communityId: string, callback?: (response: any) => void): void {
    if (!this.socket) throw new Error("WebSocket not connected");
    this.socket.emit("get_room_presence", { communityId }, callback);
  }

  onConnected(callback: (data: any) => void): void {
    this.socket?.on("connected", callback);
  }

  onUserStatus(callback: (data: UserStatusEvent) => void): void {
    this.socket?.on("user_status", callback);
  }

  onRoomJoined(callback: (data: RoomPresence & { communityId: string }) => void): void {
    this.socket?.on("room_joined", callback);
  }

  onRoomUserJoined(
    callback: (data: { userId: string; username: string; timestamp: string; onlineCount?: number }) => void
  ): void {
    this.socket?.on("room_user_joined", callback);
  }

  onRoomUserLeft(
    callback: (data: { userId: string; username: string; timestamp: string; onlineCount?: number }) => void
  ): void {
    this.socket?.on("room_user_left", callback);
  }

  onNewMessage(callback: (message: NewMessageEvent) => void): void {
    this.socket?.on("new_message", callback);
  }

  onMessageDeleted(callback: (data: MessageDeletedEvent) => void): void {
    this.socket?.on("message_deleted", callback);
  }

  onUserTyping(callback: (data: TypingEvent) => void): void {
    this.socket?.on("user_typing", callback);
  }

  onUserStoppedTyping(callback: (data: TypingEvent) => void): void {
    this.socket?.on("user_stopped_typing", callback);
  }

  onReactionAdded(callback: (data: ReactionEvent) => void): void {
    this.socket?.on("reaction_added", callback);
  }

  onReactionRemoved(callback: (data: Omit<ReactionEvent, "reaction" | "username">) => void): void {
    this.socket?.on("reaction_removed", callback);
  }

  off(event: string, callback?: any): void {
    this.socket?.off(event, callback);
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.socket?.removeAllListeners(event);
    } else {
      this.socket?.removeAllListeners();
    }
  }
}
