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
        } catch (error: any) {
            console.error("Error generating quiz:", error);
            
            let errorMessage = "Failed to generate quiz. Please try again later.";
            
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.status === 403) {
                errorMessage = "You don't have permission to generate a quiz from this chat, or you've run out of quiz attempts for today.";
            } else if (error.response?.status === 404) {
                errorMessage = "Chat not found. Please try refreshing the app.";
            } else if (error.response?.status === 400) {
                errorMessage = "Invalid request. Please check your internet connection and try again.";
            } else if (error.message?.includes('timeout') || error.code === 'ECONNABORTED') {
                errorMessage = "Request timed out. The AI service is taking longer than usual. Please try again.";
            } else if (error.message?.includes('Network Error') || !error.response) {
                errorMessage = "Network error. Please check your internet connection and try again.";
            }
            
            const processedError = new Error(errorMessage);
            processedError.name = 'QuizGenerationError';
            throw processedError;
        }
    }
}