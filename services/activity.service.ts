import { BaseService } from "./base.service";

export class ActivityService extends BaseService {
  async createActivity(data: {
    userId: string;
    type: "quiz" | "chat" | "streak";
    title: string;
    xpEarned: number;
  }) {
    const response = await this.executeRequest(
      this.getClient().post("/activity", data)
    );
    if (response.error) throw response.error;
    return response.data;
  }

  async submitQuiz(data: {
    userId: string;
    chatId?: string;
    title: string;
    answers: Array<{
      question: string;
      selectedAnswer: string;
      correctAnswer: string;
    }>;
  }) {
    const response = await this.executeRequest(
      this.getClient().post("/activity/submit-quiz", data)
    );
    if (response.error) throw response.error;
    return response.data;
  }

  async getActivitiesByUser(userId: string) {
    const response = await this.executeRequest(
      this.getClient().get(`/activity/user/${userId}`)
    );
    if (response.error) throw response.error;
    return response.data;
  }

  async getQuizActivitiesByUser(userId: string) {
    const response = await this.executeRequest(
      this.getClient().get(`/activity/user/${userId}/quiz`)
    );
    if (response.error) throw response.error;
    return response.data;
  }

  async getQuizXpTotal(userId: string) {
    const response = await this.executeRequest(
      this.getClient().get(`/activity/user/${userId}/xp/quiz`)
    );
    if (response.error) throw response.error;
    return response.data;
  }

  async getXpByType(userId: string, type: "quiz" | "chat" | "streak") {
    const response = await this.executeRequest(
      this.getClient().get(`/activity/user/${userId}/xp?type=${type}`)
    );
    if (response.error) throw response.error;
    return response.data;
  }

  async getUserWithActivities(userId: string) {
    const response = await this.executeRequest(
      this.getClient().get(`/activity/user/${userId}/details`)
    );
    if (response.error) throw response.error;
    return response.data;
  }

  async getAllActivities() {
    const response = await this.executeRequest(
      this.getClient().get("/activity")
    );
    if (response.error) throw response.error;
    return response.data;
  }
}
