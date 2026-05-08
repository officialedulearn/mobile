import type { IsoDateString } from "./common.types";

export type ContentAnalytics = {
  id: string;
  topic: string;
  category: string;
  totalViews: number | null;
  lastUpdated: IsoDateString | Date;
};
