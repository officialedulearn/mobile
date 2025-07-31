import { Chat } from "@/interface/Chat";
import httpClient from "@/utils/httpClient";

const API_KEY = process.env.EXPO_PUBLIC_API_KEY

export class ChatService {
    async getHistory(id: string): Promise<Chat[]> {
        try {
            const response = await httpClient.get(`/chat/user/${id}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching chat history:", error);
            throw error;
        }
    }

    async createChat(title: string, userId: string) {
        try {
            const response = await httpClient.post('/chat', { title, userId }, {
                headers: {
                    'x-api-key': API_KEY
                }
            });
            return response.data;
        } catch (error) {
            console.error("Error creating chat:", error);
            throw error;
        }
    }
    
    async getChatById(chatId: string) {
        try {
            const response = await httpClient.get(`/chat/${chatId}`, {
                headers: {
                    'x-api-key': API_KEY
                }
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching chat by ID:", error);
            throw error;
        }
    }

    async deleteChat(chatId: string) {
        try {
            const response = await httpClient.delete(`/chat/${chatId}`, {
                headers: {
                    'x-api-key': API_KEY
                }
            });
            return response.data;
        } catch (error) {
            console.error("Error deleting chat:", error);
            throw error;
        }
    }

    async saveMessages(messages: any[]) {
        try {
            const response = await httpClient.post('/chat/messages', { messages }, {
                headers: {
                    'x-api-key': API_KEY
                }
            });
            return response.data;
        } catch (error) {
            console.error("Error saving messages:", error);
            throw error;
        }
    }

    async getMessagesInChat(chatId: string) {
        try {
            const response = await httpClient.get(`/chat/${chatId}/messages`, {
                headers: {
                    'x-api-key': API_KEY
                }
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching messages in chat:", error);
            throw error;
        }
    }

    async deleteMessagesInChat(chatId: string) {
        try {
            const response = await httpClient.delete(`/chat/${chatId}/messages`, {
                headers: {
                    'x-api-key': API_KEY
                }
            });
            return response.data;
        } catch (error) {
            console.error("Error deleting messages in chat:", error);
            throw error;
        }
    }
}