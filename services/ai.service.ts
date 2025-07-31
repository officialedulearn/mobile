import { Message } from "@/interface/Chat";
import httpClient from "@/utils/httpClient";

const API_KEY = process.env.EXPO_PUBLIC_API_KEY

export class AIService {
    async getTitle(message: Message) {
        try {
            const response = await httpClient.post('/ai/title', message, {
                headers: {
                    'x-api-key': API_KEY
                }
            });
            return response.data;
        } catch (error) {
            console.error("Error generating title:", error);
            throw error;
        }
    }

    async generateMessages(dto: {
        messages: Array<Message>;
        chatId: string;
        userId: string;
    }) {
        try {
            const response = await httpClient.post('/ai/message', dto, {
                headers: {
                    'x-api-key': API_KEY
                }
            });
            
            return response.data;
        } catch (error) {
            console.error("Error generating messages:", error);
            throw error;
        }
    }


    async generateQuiz(dto: { chatId: string; userId: string }) {
        try {
            const response = await httpClient.post('/ai/quiz', dto, {
                headers: {
                    'x-api-key': API_KEY
                }
            });
            return response.data;
        } catch (error) {
            console.error("Error generating quiz:", error);
            throw error;
        }
    }
}