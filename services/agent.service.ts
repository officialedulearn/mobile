import { Agent, createAgentRequest } from "@/types/agent.types";
import { BaseService } from "./base.service";

function inferImageMultipartPart(uri: string): { type: string; name: string } {
  const lower = uri.toLowerCase();
  if (lower.includes(".png")) return { type: "image/png", name: "photo.png" };
  if (lower.includes(".webp"))
    return { type: "image/webp", name: "photo.webp" };
  return { type: "image/jpeg", name: "photo.jpg" };
}

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

  async uploadAgentProfilePicture(
    agentId: string,
    imageUri: string,
  ): Promise<{ profile_picture_url: string }> {
    const part = inferImageMultipartPart(imageUri);
    const formData = new FormData();
    formData.append("image", {
      uri: imageUri,
      type: part.type,
      name: part.name,
    } as any);
    const response = await this.executeRequest<{ profile_picture_url: string }>(
      this.getClient().post(
        `/agent/${agentId}/profile-picture/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      ),
    );
    if (response.error) throw response.error;
    return response.data!;
  }
}
