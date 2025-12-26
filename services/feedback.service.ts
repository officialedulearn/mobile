import httpClient from "@/utils/httpClient";

export interface Feedback {
  id: string;
  userId: string;
  content: string;
  category?: 'bug' | 'feature' | 'improvement' | 'other';
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
}

export class FeedbackService {
  async submitFeedback(
    userId: string,
    content: string,
    category?: 'bug' | 'feature' | 'improvement' | 'other'
  ): Promise<Feedback> {
    try {
      const response = await httpClient.post('/feedback', {
        userId,
        content,
        category,
      });
      return response.data;
    } catch (error) {
      console.error("Error submitting feedback:", error);
      throw error;
    }
  }

  async getUserFeedback(userId: string): Promise<Feedback[]> {
    try {
      const response = await httpClient.get(`/feedback/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching user feedback:", error);
      throw error;
    }
  }
}



