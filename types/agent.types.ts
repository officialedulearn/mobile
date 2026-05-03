import { IsoDateString } from "./common.types";

export interface Agent {
  id: string;
  name: string;
  purpose: string;
  userId: string;
  profile_picture_url: string;
  createdAt: IsoDateString;
}

export interface createAgentRequest {
  userId: string;
  name: string;
  purpose: string;
  profile_picture_url: string;
}
