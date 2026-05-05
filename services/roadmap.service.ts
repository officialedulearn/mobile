import { BaseService } from "./base.service";
import {
  Roadmap,
  RoadmapStep,
  RoadmapWithSteps,
  GenerateRoadmapDto,
  StartRoadmapStepDto,
  StartRoadmapStepResponse,
} from "@/interface/Roadmap";

export class RoadmapService extends BaseService {
  async getUserRoadmaps(userId: string): Promise<Roadmap[]> {
    const response = await this.executeRequest<Roadmap[]>(
      this.getClient().get(`/roadmap/user/${userId}`)
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async getRoadmapById(roadmapId: string): Promise<RoadmapWithSteps> {
    const response = await this.executeRequest<RoadmapWithSteps>(
      this.getClient().get(`/roadmap/${roadmapId}`)
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async getRoadmapSteps(roadmapId: string): Promise<RoadmapStep[]> {
    const response = await this.executeRequest<RoadmapStep[]>(
      this.getClient().get(`/roadmap/${roadmapId}/steps`)
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async startRoadmapStep(stepId: string, dto: StartRoadmapStepDto): Promise<StartRoadmapStepResponse> {
    const response = await this.executeRequest<StartRoadmapStepResponse>(
      this.getClient().post(`/roadmap/step/${stepId}/start`, dto)
    );
    if (response.error) throw response.error;
    return response.data!;
  }
}
