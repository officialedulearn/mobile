import { BaseService } from "./base.service";
import type {
  CreateActivityRequest,
  ListActivitiesQuery,
  PaginatedActivitiesResponse,
  SubmitQuizRequest,
  SubmitQuizResponse,
  XpActivity,
} from "@/types/activity.types";

export class ActivityService extends BaseService {
  async createActivity(data: CreateActivityRequest) {
    const response = await this.executeRequest(
      this.getClient().post("/activity", data),
    );
    if (response.error) throw response.error;
    return response.data;
  }

  async submitQuiz(data: SubmitQuizRequest) {
    const response = await this.executeRequest<SubmitQuizResponse>(
      this.getClient().post("/activity/submit-quiz", data),
    );
    if (response.error) throw response.error;
    return response.data;
  }

  async getActivitiesByUser(
    userId: string,
    query?: ListActivitiesQuery,
  ): Promise<PaginatedActivitiesResponse> {
    const hasQuery = query?.limit !== undefined || query?.page !== undefined;

    const response = await this.executeRequest<
      PaginatedActivitiesResponse | XpActivity[]
    >(
      this.getClient().get(`/activity/user/${userId}`, {
        params: hasQuery ? query : undefined,
      }),
    );
    if (response.error) throw response.error;

    const payload = response.data;
    const safeLimit = query?.limit && query.limit > 0 ? query.limit : 10;
    const safePage = query?.page && query.page > 0 ? query.page : 1;

    if (!payload) {
      return {
        data: [],
        pagination: {
          page: safePage,
          limit: safeLimit,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: safePage > 1,
        },
      };
    }

    if (Array.isArray(payload)) {
      const total = payload.length;
      return {
        data: payload,
        pagination: {
          page: safePage,
          limit: safeLimit,
          total,
          totalPages: total > 0 ? Math.ceil(total / safeLimit) : 0,
          hasNextPage: false,
          hasPrevPage: safePage > 1,
        },
      };
    }

    return payload as PaginatedActivitiesResponse;
  }

  async getQuizActivitiesByUser(userId: string) {
    const response = await this.executeRequest(
      this.getClient().get(`/activity/user/${userId}/quiz`),
    );
    if (response.error) throw response.error;
    return response.data;
  }

  async getQuizXpTotal(userId: string) {
    const response = await this.executeRequest(
      this.getClient().get(`/activity/user/${userId}/xp/quiz`),
    );
    if (response.error) throw response.error;
    return response.data;
  }

  async getXpByType(userId: string, type: "quiz" | "chat" | "streak") {
    const response = await this.executeRequest(
      this.getClient().get(`/activity/user/${userId}/xp?type=${type}`),
    );
    if (response.error) throw response.error;
    return response.data;
  }

  async getUserWithActivities(userId: string) {
    const response = await this.executeRequest(
      this.getClient().get(`/activity/user/${userId}/details`),
    );
    if (response.error) throw response.error;
    return response.data;
  }

  async getAllActivities() {
    const response = await this.executeRequest(
      this.getClient().get("/activity"),
    );
    if (response.error) throw response.error;
    return response.data;
  }
}
