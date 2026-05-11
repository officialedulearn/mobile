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
} from "@/interface/Community";

export class CommunityService extends BaseService {
  async getPublicCommunities(): Promise<Community[]> {
    const response = await this.executeRequest<Community[]>(
      this.getClient().get("/community"),
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async getAllCommunities(): Promise<Community[]> {
    const response = await this.executeRequest<Community[]>(
      this.getClient().get("/community/all"),
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async getCommunityByInviteCode(inviteCode: string): Promise<Community> {
    const response = await this.executeRequest<Community>(
      this.getClient().get(`/community/invite/${inviteCode}`),
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async getCommunityById(communityId: string): Promise<Community> {
    const response = await this.executeRequest<Community>(
      this.getClient().get(`/community/${communityId}`),
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
    },
  ): Promise<Community> {
    const response = await this.executeRequest<Community>(
      this.getClient().put(`/community/${communityId}`, data),
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async deleteCommunity(communityId: string): Promise<{ message: string }> {
    const response = await this.executeRequest(
      this.getClient().delete(`/community/${communityId}`),
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async addMember(
    communityId: string,
    userId: string,
    role?: "mod" | "member",
  ): Promise<CommunityMember> {
    const response = await this.executeRequest<CommunityMember>(
      this.getClient().post(`/community/${communityId}/members`, {
        userId,
        role,
      }),
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async getCommunityMembers(communityId: string): Promise<CommunityMember[]> {
    const response = await this.executeRequest<CommunityMember[]>(
      this.getClient().get(`/community/${communityId}/members`),
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async getMemberCount(communityId: string): Promise<{ count: number }> {
    const response = await this.executeRequest(
      this.getClient().get(`/community/${communityId}/members/count`),
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async getUserCommunities(userId: string): Promise<UserCommunity[]> {
    const response = await this.executeRequest<UserCommunity[]>(
      this.getClient().get(`/community/user/${userId}/communities`),
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async getCommunityMod(communityId: string): Promise<CommunityMod | null> {
    const response = await this.executeRequest<CommunityMod>(
      this.getClient().get(`/community/${communityId}/mod`),
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async updateMemberRole(
    communityId: string,
    userId: string,
    role: "mod" | "member",
  ): Promise<CommunityMember> {
    const response = await this.executeRequest<CommunityMember>(
      this.getClient().put(`/community/${communityId}/members/${userId}/role`, {
        role,
      }),
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async removeMember(
    communityId: string,
    userId: string,
  ): Promise<{ message: string }> {
    const response = await this.executeRequest(
      this.getClient().delete(`/community/${communityId}/members/${userId}`),
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async updateCommunityModByXP(
    communityId: string,
  ): Promise<{ message: string }> {
    const response = await this.executeRequest(
      this.getClient().post(`/community/${communityId}/update-mod`),
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async createJoinRequest(
    communityId: string,
    userId: string,
  ): Promise<CommunityJoinRequest> {
    const response = await this.executeRequest<CommunityJoinRequest>(
      this.getClient().post(`/community/${communityId}/join-requests`, {
        userId,
      }),
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async getPendingJoinRequests(
    communityId: string,
    userId?: string,
  ): Promise<CommunityJoinRequest[]> {
    const params: any = {};
    if (userId) params.userId = userId;
    const response = await this.executeRequest<CommunityJoinRequest[]>(
      this.getClient().get(`/community/${communityId}/join-requests`, {
        params,
      }),
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async updateJoinRequestStatus(
    requestId: string,
    status: "approved" | "rejected",
    communityId: string,
    userId?: string,
  ): Promise<CommunityJoinRequest> {
    const body: any = { status, communityId };
    if (userId) body.userId = userId;
    const response = await this.executeRequest<CommunityJoinRequest>(
      this.getClient().put(`/community/join-requests/${requestId}`, body),
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async deleteJoinRequest(requestId: string): Promise<{ message: string }> {
    const response = await this.executeRequest(
      this.getClient().delete(`/community/join-requests/${requestId}`),
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async resolveMentions(
    usernames: string[],
  ): Promise<{ username: string; userId: string }[]> {
    const response = await this.executeRequest(
      this.getClient().post(`/community/resolve-mentions`, { usernames }),
    );
    if (response.error) return [];
    return response.data ?? [];
  }

  async createMessage(
    communityId: string,
    content: string,
    mentionedUserIds?: string[],
    userId?: string,
  ): Promise<RoomMessage> {
    const body: any = { content, mentionedUserIds };
    if (userId) body.userId = userId;
    const response = await this.executeRequest<RoomMessage>(
      this.getClient().post(`/community/${communityId}/messages`, body),
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async getRoomMessages(
    communityId: string,
    limit: number = 50,
    offset: number = 0,
    userId?: string,
  ): Promise<RoomMessage[]> {
    const params: any = { limit, offset };
    if (userId) params.userId = userId;
    const response = await this.executeRequest<RoomMessage[]>(
      this.getClient().get(`/community/${communityId}/messages`, { params }),
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async getMessageCount(communityId: string): Promise<{ count: number }> {
    const response = await this.executeRequest(
      this.getClient().get(`/community/${communityId}/messages/count`),
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async getMessageById(messageId: string): Promise<RoomMessage> {
    const response = await this.executeRequest<RoomMessage>(
      this.getClient().get(`/community/messages/${messageId}`),
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async updateMessage(
    messageId: string,
    content: string,
  ): Promise<RoomMessage> {
    const response = await this.executeRequest<RoomMessage>(
      this.getClient().put(`/community/messages/${messageId}`, { content }),
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async deleteMessage(
    messageId: string,
    userId?: string,
  ): Promise<{ message: string }> {
    const config: any = {};
    if (userId) config.data = { userId };
    const response = await this.executeRequest(
      this.getClient().delete(`/community/messages/${messageId}`, config),
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async addReaction(
    messageId: string,
    reaction: string,
    userId?: string,
    communityId?: string,
  ): Promise<MessageReaction> {
    const body: any = { reaction };
    if (userId) body.userId = userId;
    if (communityId) body.communityId = communityId;
    const response = await this.executeRequest<MessageReaction>(
      this.getClient().post(`/community/messages/${messageId}/reactions`, body),
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async getMessageReactions(messageId: string): Promise<MessageReaction[]> {
    const response = await this.executeRequest<MessageReaction[]>(
      this.getClient().get(`/community/messages/${messageId}/reactions`),
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async getReactionCounts(messageId: string): Promise<ReactionCount[]> {
    const response = await this.executeRequest<ReactionCount[]>(
      this.getClient().get(`/community/messages/${messageId}/reactions/count`),
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async removeReaction(messageId: string): Promise<{ message: string }> {
    const response = await this.executeRequest(
      this.getClient().delete(`/community/messages/${messageId}/reactions`),
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async sendTyping(
    communityId: string,
    isTyping: boolean,
    userId?: string,
  ): Promise<{ success: boolean }> {
    const body: { isTyping: boolean; userId?: string } = { isTyping };
    if (userId) body.userId = userId;
    const response = await this.executeRequest<{ success: boolean }>(
      this.getClient().post(`/community/${communityId}/typing`, body),
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async getMessageMentions(messageId: string): Promise<MessageMention[]> {
    const response = await this.executeRequest<MessageMention[]>(
      this.getClient().get(`/community/messages/${messageId}/mentions`),
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async getUserMentions(
    userId: string,
    limit: number = 50,
  ): Promise<UserMention[]> {
    const response = await this.executeRequest<UserMention[]>(
      this.getClient().get(`/community/user/${userId}/mentions`, {
        params: { limit },
      }),
    );
    if (response.error) throw response.error;
    return response.data!;
  }
}
