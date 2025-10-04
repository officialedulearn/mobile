import httpClient from "@/utils/httpClient";
import { 
    Roadmap, 
    RoadmapStep, 
    RoadmapWithSteps, 
    GenerateRoadmapDto,
    StartRoadmapStepDto,
    StartRoadmapStepResponse
} from "@/interface/Roadmap";

export class RoadmapService {
    async getUserRoadmaps(userId: string): Promise<Roadmap[]> {
        try {
            const response = await httpClient.get(`/roadmap/user/${userId}`);
            return response.data;
        } catch (error: any) {
            console.error("Error fetching user roadmaps:", error);
            
            let errorMessage = "Failed to load your roadmaps. Please try again later.";
            
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.status === 404) {
                errorMessage = "No roadmaps found. Create your first roadmap to get started!";
            } else if (error.message?.includes('Network Error') || !error.response) {
                errorMessage = "Network error. Please check your internet connection and try again.";
            }
            
            const processedError = new Error(errorMessage);
            processedError.name = 'RoadmapFetchError';
            throw processedError;
        }
    }

    async getRoadmapById(roadmapId: string): Promise<RoadmapWithSteps> {
        try {
            const response = await httpClient.get(`/roadmap/${roadmapId}`);
            return response.data;
        } catch (error: any) {
            console.error("Error fetching roadmap by ID:", error);
            
            let errorMessage = "Failed to load roadmap details. Please try again later.";
            
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.status === 404) {
                errorMessage = "Roadmap not found. It may have been deleted.";
            } else if (error.response?.status === 403) {
                errorMessage = "You don't have permission to access this roadmap.";
            } else if (error.message?.includes('Network Error') || !error.response) {
                errorMessage = "Network error. Please check your internet connection and try again.";
            }
            
            const processedError = new Error(errorMessage);
            processedError.name = 'RoadmapDetailError';
            throw processedError;
        }
    }
    async getRoadmapSteps(roadmapId: string): Promise<RoadmapStep[]> {
        try {
            const response = await httpClient.get(`/roadmap/${roadmapId}/steps`);
            return response.data;
        } catch (error: any) {
            console.error("Error fetching roadmap steps:", error);
            
            let errorMessage = "Failed to load roadmap steps. Please try again later.";
            
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.status === 404) {
                errorMessage = "Roadmap not found or has no steps.";
            } else if (error.message?.includes('Network Error') || !error.response) {
                errorMessage = "Network error. Please check your internet connection and try again.";
            }
            
            const processedError = new Error(errorMessage);
            processedError.name = 'RoadmapStepsError';
            throw processedError;
        }
    }

   
    async startRoadmapStep(stepId: string, dto: StartRoadmapStepDto): Promise<StartRoadmapStepResponse> {
        try {
            const response = await httpClient.post(`/roadmap/step/${stepId}/start`, dto);
            return response.data;
        } catch (error: any) {
            console.error("Error starting roadmap step:", error);
            
            let errorMessage = "Failed to start roadmap step. Please try again later.";
            
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.status === 404) {
                errorMessage = "Roadmap step not found. It may have been deleted.";
            } else if (error.response?.status === 403) {
                errorMessage = "You don't have permission to start this step.";
            } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                errorMessage = "Request timed out. The AI is taking longer than usual. Please try again.";
            } else if (error.message?.includes('Network Error') || !error.response) {
                errorMessage = "Network error. Please check your internet connection and try again.";
            }
            
            const processedError = new Error(errorMessage);
            processedError.name = 'RoadmapStepStartError';
            throw processedError;
        }
    }
}
