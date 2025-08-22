import { Message } from "@/interface/Chat";
import httpClient from "@/utils/httpClient";

export class AIService {
    async getTitle(message: Message) {
        try {
            const response = await httpClient.post('/ai/title', message);
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
            const response = await httpClient.post('/ai/message', dto);
            
            return response.data;
        } catch (error) {
            console.error("Error generating messages:", error);
            throw error;
        }
    }


    async generateQuiz(dto: { chatId: string; userId: string }) {
        try {
            const response = await httpClient.post('/ai/quiz', dto);
            return response.data;
        } catch (error) {
            console.error("Error generating quiz:", error);
            throw error;
        }
    }
}