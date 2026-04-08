import type { IsoDateString } from './common.types';

export type Trend = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  createdAt: IsoDateString | Date;
};
