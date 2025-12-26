import httpClient from "@/utils/httpClient";
import { io, Socket } from "socket.io-client";
import { supabase } from "@/utils/supabase";
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

export class CommunityService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  async getPublicCommunities(): Promise<Community[]> {
    try {
      const response = await httpClient.get("/community");
      return response.data;
    } catch (error) {
      console.error("Error fetching public communities:", error);
      throw error;
    }
  }

  async getAllCommunities(): Promise<Community[]> {
    try {
      const response = await httpClient.get("/community/all");
      return response.data;
    } catch (error) {
      console.error("Error fetching all communities:", error);
      throw error;
    }
  }

  async getCommunityByInviteCode(inviteCode: string): Promise<Community> {
    try {
      const response = await httpClient.get(`/community/invite/${inviteCode}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching community by invite code:", error);
      throw error;
    }
  }

  async getCommunityById(communityId: string): Promise<Community> {
    try {
      const response = await httpClient.get(`/community/${communityId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching community by ID:", error);
      throw error;
    }
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
    try {
      const response = await httpClient.put(`/community/${communityId}`, data);
      return response.data;
    } catch (error) {
      console.error("Error updating community:", error);
      throw error;
    }
  }

  async deleteCommunity(communityId: string): Promise<{ message: string }> {
    try {
      const response = await httpClient.delete(`/community/${communityId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting community:", error);
      throw error;
    }
  }

  // ==================== MEMBER MANAGEMENT ====================

  async addMember(
    communityId: string,
    userId: string,
    role?: "mod" | "member"
  ): Promise<CommunityMember> {
    try {
      const response = await httpClient.post(
        `/community/${communityId}/members`,
        { userId, role }
      );
      return response.data;
    } catch (error) {
      console.error("Error adding member:", error);
      throw error;
    }
  }

  async getCommunityMembers(communityId: string): Promise<CommunityMember[]> {
    try {
      const response = await httpClient.get(
        `/community/${communityId}/members`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching community members:", error);
      throw error;
    }
  }

  async getMemberCount(communityId: string): Promise<{ count: number }> {
    try {
      const response = await httpClient.get(
        `/community/${communityId}/members/count`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching member count:", error);
      throw error;
    }
  }

  async getUserCommunities(userId: string): Promise<UserCommunity[]> {
    try {
      const response = await httpClient.get(
        `/community/user/${userId}/communities`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching user communities:", error);
      throw error;
    }
  }

  async getCommunityMod(communityId: string): Promise<CommunityMod | null> {
    try {
      const response = await httpClient.get(`/community/${communityId}/mod`);
      return response.data;
    } catch (error) {
      console.error("Error fetching community mod:", error);
      throw error;
    }
  }

  async updateMemberRole(
    communityId: string,
    userId: string,
    role: "mod" | "member"
  ): Promise<CommunityMember> {
    try {
      const response = await httpClient.put(
        `/community/${communityId}/members/${userId}/role`,
        { role }
      );
      return response.data;
    } catch (error) {
      console.error("Error updating member role:", error);
      throw error;
    }
  }

  async removeMember(
    communityId: string,
    userId: string
  ): Promise<{ message: string }> {
    try {
      const response = await httpClient.delete(
        `/community/${communityId}/members/${userId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error removing member:", error);
      throw error;
    }
  }

  async updateCommunityModByXP(
    communityId: string
  ): Promise<{ message: string }> {
    try {
      const response = await httpClient.post(
        `/community/${communityId}/update-mod`
      );
      return response.data;
    } catch (error) {
      console.error("Error updating mod by XP:", error);
      throw error;
    }
  }

 
  async createJoinRequest(communityId: string, userId: string): Promise<CommunityJoinRequest> {
    try {
      const response = await httpClient.post(
        `/community/${communityId}/join-requests`,
        { userId }
      );
      return response.data;
    } catch (error) {
      console.error("Error creating join request:", error);
      throw error;
    }
  }

  async getPendingJoinRequests(
    communityId: string,
    userId?: string
  ): Promise<CommunityJoinRequest[]> {
    try {
      const params: any = {};
      if (userId) {
        params.userId = userId;
      }
      const response = await httpClient.get(
        `/community/${communityId}/join-requests`,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching pending join requests:", error);
      throw error;
    }
  }

  async updateJoinRequestStatus(
    requestId: string,
    status: "approved" | "rejected",
    communityId: string,
    userId?: string
  ): Promise<CommunityJoinRequest> {
    try {
      const body: any = { status, communityId };
      if (userId) {
        body.userId = userId;
      }
      const response = await httpClient.put(
        `/community/join-requests/${requestId}`,
        body
      );
      return response.data;
    } catch (error) {
      console.error("Error updating join request status:", error);
      throw error;
    }
  }

  async deleteJoinRequest(requestId: string): Promise<{ message: string }> {
    try {
      const response = await httpClient.delete(
        `/community/join-requests/${requestId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error deleting join request:", error);
      throw error;
    }
  }

  async resolveMentions(usernames: string[]): Promise<{ username: string; userId: string }[]> {
    try {
      const response = await httpClient.post(
        `/community/resolve-mentions`,
        { usernames }
      );
      return response.data;
    } catch (error) {
      console.error("Error resolving mentions:", error);
      return [];
    }
  }

  async createMessage(
    communityId: string,
    content: string,
    mentionedUserIds?: string[],
    userId?: string
  ): Promise<RoomMessage> {
    try {
      const body: any = { content, mentionedUserIds };
      if (userId) {
        body.userId = userId;
      }
      const response = await httpClient.post(
        `/community/${communityId}/messages`,
        body
      );
      return response.data;
    } catch (error) {
      console.error("Error creating message:", error);
      throw error;
    }
  }

  async getRoomMessages(
    communityId: string,
    limit: number = 50,
    offset: number = 0,
    userId?: string
  ): Promise<RoomMessage[]> {
    try {
      const params: any = { limit, offset };
      if (userId) {
        params.userId = userId;
      }
      const response = await httpClient.get(
        `/community/${communityId}/messages`,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching room messages:", error);
      throw error;
    }
  }

  async getMessageCount(communityId: string): Promise<{ count: number }> {
    try {
      const response = await httpClient.get(
        `/community/${communityId}/messages/count`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching message count:", error);
      throw error;
    }
  }

  async getMessageById(messageId: string): Promise<RoomMessage> {
    try {
      const response = await httpClient.get(`/community/messages/${messageId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching message by ID:", error);
      throw error;
    }
  }

  async updateMessage(
    messageId: string,
    content: string
  ): Promise<RoomMessage> {
    try {
      const response = await httpClient.put(
        `/community/messages/${messageId}`,
        { content }
      );
      return response.data;
    } catch (error) {
      console.error("Error updating message:", error);
      throw error;
    }
  }

  async deleteMessage(messageId: string, userId?: string): Promise<{ message: string }> {
    try {
      const config: any = {};
      if (userId) {
        config.data = { userId };
      }
      const response = await httpClient.delete(
        `/community/messages/${messageId}`,
        config
      );
      return response.data;
    } catch (error) {
      console.error("Error deleting message:", error);
      throw error;
    }
  }

  async addReaction(
    messageId: string,
    reaction: string,
    userId?: string,
    communityId?: string
  ): Promise<MessageReaction> {
    try {
      const body: any = { reaction };
      if (userId) {
        body.userId = userId;
      }
      if (communityId) {
        body.communityId = communityId;
      }
      const response = await httpClient.post(
        `/community/messages/${messageId}/reactions`,
        body
      );
      return response.data;
    } catch (error) {
      console.error("Error adding reaction:", error);
      throw error;
    }
  }

  async getMessageReactions(messageId: string): Promise<MessageReaction[]> {
    try {
      const response = await httpClient.get(
        `/community/messages/${messageId}/reactions`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching message reactions:", error);
      throw error;
    }
  }

  async getReactionCounts(messageId: string): Promise<ReactionCount[]> {
    try {
      const response = await httpClient.get(
        `/community/messages/${messageId}/reactions/count`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching reaction counts:", error);
      throw error;
    }
  }

  async removeReaction(messageId: string): Promise<{ message: string }> {
    try {
      const response = await httpClient.delete(
        `/community/messages/${messageId}/reactions`
      );
      return response.data;
    } catch (error) {
      console.error("Error removing reaction:", error);
      throw error;
    }
  }

  async getMessageMentions(messageId: string): Promise<MessageMention[]> {
    try {
      const response = await httpClient.get(
        `/community/messages/${messageId}/mentions`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching message mentions:", error);
      throw error;
    }
  }

  async getUserMentions(
    userId: string,
    limit: number = 50
  ): Promise<UserMention[]> {
    try {
      const response = await httpClient.get(
        `/community/user/${userId}/mentions`,
        { params: { limit } }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching user mentions:", error);
      throw error;
    }
  }
  async connectWebSocket(): Promise<Socket> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("No authentication token available");
      }

      const baseURL =
        process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000";
      
      let wsURL: string;
      if (baseURL.startsWith('https://')) {
        wsURL = baseURL.replace('https://', 'wss://');
      } else if (baseURL.startsWith('http://')) {
        wsURL = baseURL.replace('http://', 'ws://');
      } else {
        wsURL = baseURL.startsWith('ws://') || baseURL.startsWith('wss://') 
          ? baseURL 
          : `ws://${baseURL}`;
      }

      wsURL = wsURL.replace(/\/$/, '');

      console.log('🔌 Connecting to WebSocket:', `${wsURL}/community`);

      this.socket = io(`${wsURL}/community`, {
        auth: {
          token: session.access_token,
        },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
        timeout: 20000,
      });

      if (!this.socket) {
        throw new Error("Failed to create socket instance");
      }

      this.socket.on("connect", () => {
        console.log("✅ WebSocket connected:", this.socket?.id);
        this.reconnectAttempts = 0;
      });

      this.socket.on("disconnect", (reason) => {
        console.log("❌ WebSocket disconnected:", reason);
      });

      this.socket.on("connect_error", (error: any) => {
        console.error("❌ WebSocket connection error:", error.message || error);
        console.error("Error details:", error);
        this.reconnectAttempts++;

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error("Max reconnection attempts reached");
          this.socket?.close();
        }
      });
      this.socket.on("connected", (data) => {
        console.log("✅ Server confirmed connection:", data);
      });

      const socketInstance = this.socket;
      if (!socketInstance) {
        throw new Error("Socket instance is null");
      }

      return new Promise<Socket>((resolve, reject) => {
        const timeout = setTimeout(() => {
          if (!socketInstance.connected) {
            reject(new Error("WebSocket connection timeout"));
          }
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
    } catch (error) {
      console.error("Error connecting to WebSocket:", error);
      throw error;
    }
  }

  disconnectWebSocket(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log("🔌 WebSocket disconnected");
    }
  }
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  joinRoom(communityId: string, userId?: string, callback?: (response: any) => void): void {
    if (!this.socket) {
      throw new Error("WebSocket not connected");
    }

    const data: any = { communityId };
    if (userId) {
      data.userId = userId;
    }
    this.socket.emit("join_room", data, callback);
  }

  leaveRoom(communityId: string, callback?: (response: any) => void): void {
    if (!this.socket) {
      throw new Error("WebSocket not connected");
    }

    this.socket.emit("leave_room", { communityId }, callback);
  }

  sendMessage(
    communityId: string,
    content: string,
    mentionedUserIds?: string[],
    userId?: string,
    callback?: (response: any) => void
  ): void {
    if (!this.socket || !this.socket.connected) {
      console.error("WebSocket not connected. Cannot send message.");
      if (callback) {
        callback({ error: "WebSocket not connected" });
      }
      return;
    }

    const data: any = { communityId, content, mentionedUserIds };
    if (userId) {
      data.userId = userId;
    }
    this.socket.emit("send_message", data, callback);
  }

  deleteMessageWS(
    messageId: string,
    communityId: string,
    callback?: (response: any) => void
  ): void {
    if (!this.socket) {
      throw new Error("WebSocket not connected");
    }

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
    if (!this.socket) {
      throw new Error("WebSocket not connected");
    }

    this.socket.emit(
      "add_reaction",
      { messageId, communityId, reaction },
      callback
    );
  }

  removeReactionWS(
    messageId: string,
    communityId: string,
    callback?: (response: any) => void
  ): void {
    if (!this.socket) {
      throw new Error("WebSocket not connected");
    }

    this.socket.emit("remove_reaction", { messageId, communityId }, callback);
  }

  getOnlineUsers(callback?: (response: any) => void): void {
    if (!this.socket) {
      throw new Error("WebSocket not connected");
    }

    this.socket.emit("get_online_users", {}, callback);
  }

  getRoomPresence(
    communityId: string,
    callback?: (response: any) => void
  ): void {
    if (!this.socket) {
      throw new Error("WebSocket not connected");
    }

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

  onRoomUserJoined(callback: (data: { userId: string; username: string; timestamp: string; onlineCount?: number }) => void): void {
    this.socket?.on("room_user_joined", callback);
  }

  onRoomUserLeft(callback: (data: { userId: string; username: string; timestamp: string; onlineCount?: number }) => void): void {
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