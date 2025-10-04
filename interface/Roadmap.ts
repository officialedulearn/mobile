export type Roadmap = {
    id: string;
    userId: string;
    chatId: string;
    topic: string;
    title: string;
    description: string;
    createdAt: Date;
}

export type RoadmapStep = {
    id: string;
    roadmapId: string;
    prompt: string;
    title: string;
    description: string;
    time: number;
    createdAt: Date;
}

export type RoadmapWithSteps = {
    roadmap: Roadmap;
    steps: RoadmapStep[];
}

export type GenerateRoadmapDto = {
    userId: string;
    topic: string;
}

export type StartRoadmapStepDto = {
    userId: string;
}

export type StartRoadmapStepResponse = {
    step: RoadmapStep;
    userMessage: {
        id: string;
        role: string;
        content: { text: string };
        createdAt: Date;
        chatId: string;
    };
    aiResponse: {
        id: string;
        role: string;
        content: { text: string };
        createdAt: Date;
        chatId: string;
    };
}

