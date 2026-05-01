import { Agent, createAgentRequest } from "@/types/agent.types";
import { BaseService } from "./base.service";

export class AgentService extends BaseService {
  async createAgent(request: createAgentRequest): Promise<Agent> {
    const response = await this.executeRequest<Agent>(
      this.getClient().post("/agent", request),
    );
    if (response.error) throw response.error;
    return response.data!;
  }
  async getAgent(agentId: string): Promise<Agent> {
    const response = await this.executeRequest<Agent>(
      this.getClient().get(`/agent/${agentId}`),
    );
    if (response.error) throw response.error;
    return response.data!;
  }
  async getUserAgent(userId: string): Promise<Agent> {
    const response = await this.executeRequest<Agent>(
      this.getClient().get(`/agent/user/${userId}`),
    );
    if (response.error) throw response.error;
    return response.data!;
  }
}
