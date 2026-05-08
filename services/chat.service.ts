import { Chat, Message } from "@/interface/Chat";
import { BaseService } from "./base.service";

type MessagePagination = {
  offset?: number;
  limit?: number;
  beforeMessageId?: string;
};

export class ChatService extends BaseService {
  async getHistory(id: string): Promise<Chat[]> {
    const response = await this.executeRequest<Chat[]>(
      this.getClient().get(`/chat/user/${id}`),
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async createChat(title: string, userId: string) {
    const response = await this.executeRequest(
      this.getClient().post("/chat", { title, userId }),
    );
    if (response.error) throw response.error;
    return response.data;
  }

  async getChatById(chatId: string) {
    const response = await this.executeRequest(
      this.getClient().get(`/chat/${chatId}`),
    );
    if (response.error) throw response.error;
    return response.data;
  }

  async deleteChat(chatId: string) {
    const response = await this.executeRequest(
      this.getClient().delete(`/chat/${chatId}`),
    );
    if (response.error) throw response.error;
    return response.data;
  }

  async saveMessages(messages: any[]) {
    const response = await this.executeRequest(
      this.getClient().post("/chat/messages", { messages }),
    );
    if (response.error) throw response.error;
    return response.data;
  }

  async getMessagesInChat(
    chatId: string,
    pagination: MessagePagination = {},
  ): Promise<Message[]> {
    const { offset = 0, limit = 5, beforeMessageId } = pagination;
    const response = await this.executeRequest(
      this.getClient().get(`/chat/${chatId}/messages`, {
        params: {
          offset,
          limit,
          ...(beforeMessageId ? { before_message_id: beforeMessageId } : {}),
        },
      }),
    );
    if (response.error) throw response.error;
    return response.data || [];
  }

  async deleteMessagesInChat(chatId: string) {
    const response = await this.executeRequest(
      this.getClient().delete(`/chat/${chatId}/messages`),
    );
    if (response.error) throw response.error;
    return response.data;
  }
}
