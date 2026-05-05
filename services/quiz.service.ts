import {
    ListMyPublicQuizzesResponse,
    ListPublicQuizzesResponse,
    ListQuizzesQuery,
    PublicQuizDetail,
    PublishPublicQuizRequest,
    PublishPublicQuizResponse,
    StartPublicQuizParticipationResponse,
    SubmitPublicQuizRequest,
    SubmitPublicQuizResponse,
} from "@/types/quizzes.types";
import { BaseService } from "./base.service";

export class QuizService extends BaseService {
  // POST /quizzes/public (JWT)
  async publishQuiz(payload: PublishPublicQuizRequest) {
    const response = await this.executeRequest<PublishPublicQuizResponse>(
      this.getClient().post("/quizzes/public", payload),
    );
    if (response.error) throw response.error;
    return response.data;
  }

  // GET /quizzes/public?limit&offset&sort
  async listPublicQuizzes(query?: ListQuizzesQuery) {
    const response = await this.executeRequest<ListPublicQuizzesResponse>(
      this.getClient().get("/quizzes/public", { params: query }),
    );
    if (response.error) throw response.error;
    return response.data;
  }

  // GET /quizzes/mine?limit&offset (JWT)
  async listMyQuizzes(query?: Pick<ListQuizzesQuery, "limit" | "offset">) {
    const response = await this.executeRequest<ListMyPublicQuizzesResponse>(
      this.getClient().get("/quizzes/mine", { params: query }),
    );
    if (response.error) throw response.error;
    return response.data;
  }

  // GET /quizzes/public/:id (no auth)
  async getQuizById(quizId: string) {
    const response = await this.executeRequest<PublicQuizDetail>(
      this.getClient().get(`/quizzes/public/${quizId}`),
    );
    if (response.error) throw response.error;
    return response.data;
  }

  // POST /quizzes/public/:id/participate (JWT)
  async joinQuiz(quizId: string) {
    const response =
      await this.executeRequest<StartPublicQuizParticipationResponse>(
        this.getClient().post(`/quizzes/public/${quizId}/participate`),
      );
    if (response.error) throw response.error;
    return response.data;
  }

  // POST /quizzes/public/:id/attempt (JWT)
  async submitQuiz(quizId: string, payload: SubmitPublicQuizRequest) {
    const response = await this.executeRequest<SubmitPublicQuizResponse>(
      this.getClient().post(`/quizzes/public/${quizId}/attempt`, payload),
    );
    if (response.error) throw response.error;
    return response.data;
  }
}
