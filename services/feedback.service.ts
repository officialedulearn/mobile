import { BaseService } from "./base.service";

export interface Feedback {
  id: string;
  userId: string;
  content: string;
  category?: "bug" | "feature" | "improvement" | "other";
  status: "pending" | "reviewed" | "resolved";
  createdAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
}

export class FeedbackService extends BaseService {
  async submitFeedback(
    userId: string,
    content: string,
    category?: "bug" | "feature" | "improvement" | "other"
  ): Promise<Feedback> {
    const response = await this.executeRequest<Feedback>(
      this.getClient().post("/feedback", { userId, content, category })
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async getUserFeedback(userId: string): Promise<Feedback[]> {
    const response = await this.executeRequest<Feedback[]>(
      this.getClient().get(`/feedback/user/${userId}`)
    );
    if (response.error) throw response.error;
    return response.data!;
  }
}
