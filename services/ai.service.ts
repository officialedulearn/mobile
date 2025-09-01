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
            if (response.data && typeof response.data === 'string' && response.data.includes('Error:')) {
                throw new Error(response.data);
            }
            
            if (response.data && response.data.message && response.data.message.includes('Error:')) {
                throw new Error(response.data.message);
            }
            
            return response.data;
        } catch (error: any) {
            console.error("Error generating quiz:", error);
            
            let errorMessage = "Failed to generate quiz. Please try again later.";
            
            if (error.message && error.message.includes('Not enough conversation content')) {
                errorMessage = "Not enough conversation content. Have at least 2 exchanges with the AI to generate a meaningful quiz.";
            } else if (error.message && error.message.includes('already been tested')) {
                errorMessage = "This chat has already been used for a quiz. Each conversation can only generate one quiz.";
            } else if (error.message && error.message.includes('No quiz attempts left')) {
                errorMessage = "You've reached your daily quiz limit. Quiz attempts reset daily.";
            } else if (error.message && error.message.includes('Insufficient credits')) {
                errorMessage = "You need at least 0.5 credits to generate a quiz. Purchase more credits to continue.";
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.message) {
                errorMessage = error.message;
            } else {
                if (error.response?.status === 403) {
                    errorMessage = "You don't have permission to generate a quiz from this chat, or you've run out of quiz attempts for today.";
                } else if (error.response?.status === 404) {
                    errorMessage = "Chat not found. Please try refreshing the app.";
                } else if (error.response?.status === 400) {
                    errorMessage = "Invalid request. Please check your internet connection and try again.";
                } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                    errorMessage = "Request timed out. The AI service is taking longer than usual. Please try again.";
                } else if (error.message?.includes('Network Error') || !error.response) {
                    errorMessage = "Network error. Please check your internet connection and try again.";
                }
            }
            
            const processedError = new Error(errorMessage);
            processedError.name = 'QuizGenerationError';
            throw processedError;
        }
    }
}