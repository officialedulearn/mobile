import type { IsoDateString } from './common.types';
import type { Message, RoadmapPromptMessageContent } from './chat.types';

export type Roadmap = {
  id: string;
  userId: string;
  chatId: string;
  topic: string;
  title: string;
  description: string;
  claimableNFT: string | null;
  createdAt: IsoDateString | Date;
};

export type RoadmapStep = {
  id: string;
  roadmapId: string;
  prompt: string;
  title: string;
  description: string;
  time: number;
  createdAt: IsoDateString | Date;
  done: boolean | null;
};

export type GenerateRoadmapRequest = {
  userId: string;
  topic: string;
};

export type RoadmapWithStepsResponse = {
  roadmap: Roadmap;
  steps: RoadmapStep[];
};

export type StartRoadmapStepRequest = {
  userId: string;
};

export type RoadmapStepInlineMessage = {
  id: string;
  role: string;
  content: RoadmapPromptMessageContent;
  createdAt: IsoDateString | Date;
  chatId: string;
};

export type StartRoadmapStepResponse = {
  step: RoadmapStep;
  userMessage: RoadmapStepInlineMessage;
  aiResponse: Message | Record<string, unknown>;
};

export type EditRoadmapStepRequest = {
  userId: string;
  prompt: string;
  title: string;
  description: string;
  time: number;
};
